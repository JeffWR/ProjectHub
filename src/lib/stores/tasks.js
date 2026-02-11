import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { user } from '$lib/stores/auth';
import { addToast } from '$lib/stores/toast';

// --- SYNC STATUS & OFFLINE SUPPORT ---
export const syncStatus = writable('idle'); // 'idle' | 'syncing' | 'error' | 'offline'
export const lastSyncTime = writable(null);
export const isOnline = writable(browser ? navigator.onLine : true);

// Offline detection
if (browser) {
    window.addEventListener('online', () => {
        isOnline.set(true);
        syncStatus.set('syncing');
        addToast('Back online! Syncing...', 'info');
        processQueue();
    });
    window.addEventListener('offline', () => {
        isOnline.set(false);
        syncStatus.set('offline');
        addToast('Working offline', 'info');
    });
}

// Sync queue for offline operations
const getSyncQueue = () => {
    if (!browser) return [];
    const queue = localStorage.getItem('syncQueue');
    return queue ? JSON.parse(queue) : [];
};

const addToSyncQueue = (operation) => {
    if (!browser) return;
    const queue = getSyncQueue();
    queue.push({ ...operation, timestamp: Date.now() });
    localStorage.setItem('syncQueue', JSON.stringify(queue));
};

const removeFromSyncQueue = (operationId) => {
    if (!browser) return;
    const queue = getSyncQueue();
    const filtered = queue.filter(op => op.id !== operationId);
    localStorage.setItem('syncQueue', JSON.stringify(filtered));
};

const processQueue = async () => {
    const queue = getSyncQueue();
    if (queue.length === 0) {
        syncStatus.set('idle');
        return;
    }

    syncStatus.set('syncing');
    const currentUser = get(user);
    if (!currentUser) {
        syncStatus.set('idle');
        return;
    }

    for (const operation of queue) {
        try {
            if (operation.type === 'add') {
                await supabase.from('tasks').insert({
                    id: operation.data.id,
                    user_id: currentUser.id,
                    title: operation.data.title,
                    description: operation.data.description,
                    priority: operation.data.priority,
                    est_time: operation.data.estTime,
                    status: operation.data.status || 'todo'
                });
            } else if (operation.type === 'update') {
                await supabase.from('tasks').update(operation.data).eq('id', operation.taskId);
            } else if (operation.type === 'delete') {
                await supabase.from('tasks').delete().eq('id', operation.taskId);
            }
            removeFromSyncQueue(operation.id);
        } catch (error) {
            console.error('Failed to process queued operation:', error);
        }
    }

    syncStatus.set('idle');
    lastSyncTime.set(Date.now());
    addToast('Sync complete', 'success');
};

// --- 1. INTERNAL HELPER (PRESERVED) ---
// We keep your logic that converts hours+minutes into total minutes
const createTaskModel = (data) => {
    const totalMinutes = (parseInt(data.estHours || 0) * 60) + parseInt(data.estTime || 25);

    return {
        id: crypto.randomUUID(), // Update: Use UUIDs to match Supabase format
        title: data.title,
        description: data.description || '',
        status: 'todo',
        priority: data.priority || 'Medium',
        estTime: totalMinutes > 0 ? totalMinutes : 25,
        timeSpent: 0,
        createdAt: new Date().toISOString(),
        completedAt: null,
        position: 0
    };
};

// --- 2. STORE INITIALIZATION ---
// We default to localStorage to prevent "flicker", then load cloud data
const initialTasks = browser && localStorage.getItem('tasks') 
    ? JSON.parse(localStorage.getItem('tasks')) 
    : [];

export const tasks = writable(initialTasks);

// THE HERO SELECTOR (PRESERVED)
export const heroTask = derived(tasks, $tasks => {
    return $tasks.find(t => t.status === 'inprogress') || null;
});

// SYNC TO LOCALSTORAGE (PRESERVED BACKUP)
if (browser) {
    tasks.subscribe(value => localStorage.setItem('tasks', JSON.stringify(value)));
}

// --- 3. CLOUD SYNC FUNCTIONS (NEW) ---

// LOAD: Pulls from Supabase when app starts
export const loadTasks = async () => {
    const currentUser = get(user);
    if (!currentUser) return;

    try {
        syncStatus.set('syncing');

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('position', { ascending: true }); // Sort by position

        if (error) throw error;

        if (data) {
            // Map database columns (snake_case) to your app model (camelCase)
            const mappedTasks = data.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                estTime: t.est_time,
                timeSpent: t.time_spent,
                createdAt: t.created_at,
                completedAt: t.completed_at,
                position: t.position ?? 0 // Include position
            }));

            tasks.set(mappedTasks);
            syncStatus.set('idle');
            lastSyncTime.set(Date.now());
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        syncStatus.set('error');
        addToast('Failed to load tasks from cloud', 'error');
    }
};

// --- 4. ACTIONS (HYBRID) ---

export const addTask = async (formData) => {
    // 1. Create Local Model (Optimistic UI)
    const newTask = createTaskModel(formData);
    const currentUser = get(user);

    // Update Store Immediately - add at top (position 0)
    tasks.update(all => {
        // Increment all existing task positions
        const incrementedTasks = all.map(t => ({
            ...t,
            position: (t.position ?? 0) + 1
        }));

        // Add new task at position 0
        return [{ ...newTask, position: 0 }, ...incrementedTasks];
    });

    // 2. Sync to Server
    if (currentUser) {
        const online = get(isOnline);

        if (!online) {
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'add',
                data: newTask
            });
            addToast('Task created (queued for sync)', 'info');
            return;
        }

        try {
            // Get current tasks to update their positions
            const currentTasks = get(tasks);

            // Insert new task at position 0
            const { error: insertError } = await supabase.from('tasks').insert({
                id: newTask.id,
                user_id: currentUser.id,
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                est_time: newTask.estTime,
                status: 'todo',
                position: 0
            });

            if (insertError) throw insertError;

            // Update positions for all other tasks using UPDATE instead of upsert
            const otherTasks = currentTasks.filter(t => t.id !== newTask.id);
            if (otherTasks.length > 0) {
                const updatePromises = otherTasks.map(t =>
                    supabase
                        .from('tasks')
                        .update({ position: t.position })
                        .eq('id', t.id)
                );

                const results = await Promise.all(updatePromises);
                const errors = results.filter(r => r.error);
                if (errors.length > 0) {
                    console.error('Error updating positions:', errors);
                }
            }

            addToast('Task created', 'success');
            lastSyncTime.set(Date.now());
        } catch (error) {
            console.error("Error syncing add:", error);
            addToast('Failed to sync task. Saved locally.', 'error');

            // Add to queue for retry
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'add',
                data: newTask
            });
        }
    }
};

export const updateTask = async (id, updates) => {
    // 1. Update Local
    tasks.update(all => all.map(t => t.id === id ? { ...t, ...updates } : t));

    // 2. Sync to Server
    const currentUser = get(user);
    if (currentUser) {
        // Convert camelCase updates to snake_case for DB if necessary
        const dbUpdates = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.priority) dbUpdates.priority = updates.priority;
        if (updates.estTime) dbUpdates.est_time = updates.estTime;

        const online = get(isOnline);

        if (!online) {
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'update',
                taskId: id,
                data: dbUpdates
            });
            return;
        }

        try {
            const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
            if (error) throw error;
            lastSyncTime.set(Date.now());
        } catch (error) {
            console.error('Error updating task:', error);
            addToast('Failed to sync update', 'error');

            // Add to queue for retry
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'update',
                taskId: id,
                data: dbUpdates
            });
        }
    }
};

export const moveTask = async (taskId, newStatus, targetIndex = -1) => {
    // Store original state for potential rollback
    const originalTasks = get(tasks);

    // 1. Complex Splicing Logic (PRESERVED)
    // This handles the visual drag-and-drop reordering locally
    let updatedTasks;
    tasks.update(all => {
        const oldIndex = all.findIndex(t => t.id === taskId);
        if (oldIndex === -1) return all;

        const [task] = all.splice(oldIndex, 1);
        task.status = newStatus;

        if (newStatus === 'archived') {
            task.completedAt = new Date().toISOString();
        } else {
            // Reset completedAt if moving back to active
            task.completedAt = null;
        }

        if (targetIndex !== -1) {
            const safeIndex = Math.min(targetIndex, all.length);
            all.splice(safeIndex, 0, task);
        } else {
            all.push(task);
        }

        // Recalculate positions for all tasks
        const tasksWithPositions = all.map((t, index) => ({
            ...t,
            position: index
        }));

        updatedTasks = tasksWithPositions;
        return tasksWithPositions;
    });

    // 2. Sync Status AND Positions to Server
    const currentUser = get(user);

    if (currentUser) {
        const online = get(isOnline);

        if (!online) {
            // Queue for offline sync
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'update',
                taskId: taskId,
                data: { status: newStatus, completed_at: newStatus === 'archived' ? new Date().toISOString() : null }
            });
            // Also queue position updates for all tasks
            updatedTasks.forEach(t => {
                addToSyncQueue({
                    id: crypto.randomUUID(),
                    type: 'update',
                    taskId: t.id,
                    data: { position: t.position }
                });
            });
            return;
        }

        try {
            // Update each task individually to avoid RLS issues with upsert
            // Use Promise.all for parallel updates (faster than sequential)
            const updatePromises = updatedTasks.map(t =>
                supabase
                    .from('tasks')
                    .update({
                        position: t.position,
                        status: t.status,
                        completed_at: t.completedAt
                    })
                    .eq('id', t.id)
            );

            const results = await Promise.all(updatePromises);

            // Check if any updates failed
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                console.error('Task sync failed:', errors[0].error.message);
                throw errors[0].error;
            }

            lastSyncTime.set(Date.now());
        } catch (error) {
            console.error('Task sync error:', error.message);
            addToast('Failed to sync task. Changes saved locally.', 'error');

            // Rollback on error
            tasks.set(originalTasks);

            // Add to queue for retry
            updatedTasks.forEach(t => {
                addToSyncQueue({
                    id: crypto.randomUUID(),
                    type: 'update',
                    taskId: t.id,
                    data: {
                        position: t.position,
                        status: t.status,
                        completed_at: t.completedAt
                    }
                });
            });
        }
    }
};

export const deleteTask = async (id) => {
    // Store for potential rollback
    const deletedTask = get(tasks).find(t => t.id === id);

    // 1. Local Delete
    tasks.update(all => all.filter(t => t.id !== id));

    // 2. Server Delete
    const currentUser = get(user);
    if (currentUser) {
        const online = get(isOnline);

        if (!online) {
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'delete',
                taskId: id
            });
            addToast('Task deleted (queued for sync)', 'info');
            return;
        }

        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;

            addToast('Task deleted', 'success');
            lastSyncTime.set(Date.now());
        } catch (error) {
            console.error('Error deleting task:', error);
            addToast('Failed to delete from cloud', 'error');

            // Rollback
            if (deletedTask) {
                tasks.update(all => [deletedTask, ...all]);
            }

            // Add to queue for retry
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'delete',
                taskId: id
            });
        }
    }
};

export const updateTaskProgress = async (id, secondsToAdd) => {
    let newTimeSpent = 0;
    let taskFound = false;

    // 1. Local Update
    tasks.update(all => all.map(t => {
        if (t.id === id) {
            taskFound = true;
            const oldTimeSpent = t.timeSpent;
            newTimeSpent = oldTimeSpent + (secondsToAdd / 60);
            return { ...t, timeSpent: newTimeSpent };
        }
        return t;
    }));

    if (!taskFound) {
        console.error('Timer update failed: Task not found');
        return;
    }

    // 2. Server Update
    const currentUser = get(user);

    if (currentUser) {
        const online = get(isOnline);

        if (!online) {
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'update',
                taskId: id,
                data: { time_spent: newTimeSpent }
            });
            return;
        }

        try {
            const { error } = await supabase.from('tasks')
                .update({ time_spent: newTimeSpent })
                .eq('id', id);

            if (error) {
                console.error('Timer sync error:', error.message);

                // Queue for retry
                addToSyncQueue({
                    id: crypto.randomUUID(),
                    type: 'update',
                    taskId: id,
                    data: { time_spent: newTimeSpent }
                });
                addToast('Failed to sync timer progress', 'error');
                return;
            }

            lastSyncTime.set(Date.now());
        } catch (error) {
            console.error('Timer sync error:', error.message);

            // Queue for retry
            addToSyncQueue({
                id: crypto.randomUUID(),
                type: 'update',
                taskId: id,
                data: { time_spent: newTimeSpent }
            });
        }
    }
};