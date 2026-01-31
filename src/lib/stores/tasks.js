import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { user } from '$lib/stores/auth';

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
        completedAt: null
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

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

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
            completedAt: t.completed_at
        }));
        tasks.set(mappedTasks);
    }
};

// --- 4. ACTIONS (HYBRID) ---

export const addTask = async (formData) => {
    // 1. Create Local Model (Optimistic UI)
    const newTask = createTaskModel(formData);
    const currentUser = get(user);

    // Update Store Immediately
    tasks.update(all => [newTask, ...all]);

    // 2. Sync to Server
    if (currentUser) {
        const { error } = await supabase.from('tasks').insert({
            id: newTask.id, // We generated a UUID above, so we send it
            user_id: currentUser.id,
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            est_time: newTask.estTime,
            status: 'todo'
        });
        if (error) console.error("Error syncing add:", error);
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
        
        await supabase.from('tasks').update(dbUpdates).eq('id', id);
    }
};

export const moveTask = async (taskId, newStatus, targetIndex = -1) => {
    // 1. Complex Splicing Logic (PRESERVED)
    // This handles the visual drag-and-drop reordering locally
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
        return [...all]; 
    });

    // 2. Sync Status to Server
    // Note: We are currently syncing the STATUS change, but not the exact sort order index.
    // (Exact persistent manual sorting requires a separate 'order_index' column in DB)
    const currentUser = get(user);
    if (currentUser) {
        const updates = { status: newStatus };
        if (newStatus === 'archived') updates.completed_at = new Date().toISOString();
        
        await supabase.from('tasks').update(updates).eq('id', taskId);
    }
};

export const deleteTask = async (id) => {
    // 1. Local Delete
    tasks.update(all => all.filter(t => t.id !== id));

    // 2. Server Delete
    const currentUser = get(user);
    if (currentUser) {
        await supabase.from('tasks').delete().eq('id', id);
    }
};

export const updateTaskProgress = async (id, secondsToAdd) => {
    let newTimeSpent = 0;

    // 1. Local Update
    tasks.update(all => all.map(t => {
        if (t.id === id) {
            newTimeSpent = t.timeSpent + (secondsToAdd / 60);
            return { ...t, timeSpent: newTimeSpent };
        }
        return t;
    }));

    // 2. Server Update
    const currentUser = get(user);
    if (currentUser) {
        await supabase.from('tasks')
            .update({ time_spent: newTimeSpent })
            .eq('id', id);
    }
};