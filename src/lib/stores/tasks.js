import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// --- 1. INTERNAL HELPER (No external import needed) ---
const createTaskModel = (data) => {
    const totalMinutes = (parseInt(data.estHours || 0) * 60) + parseInt(data.estTime || 25);

    return {
        id: Date.now(),
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
const initialTasks = browser && localStorage.getItem('tasks') 
    ? JSON.parse(localStorage.getItem('tasks')) 
    : [];

export const tasks = writable(initialTasks);

// THE HERO SELECTOR: This replaces "activeTaskId". 
// It automatically grabs the first task in "In Focus".
export const heroTask = derived(tasks, $tasks => {
    return $tasks.find(t => t.status === 'inprogress') || null;
});

if (browser) {
    tasks.subscribe(value => localStorage.setItem('tasks', JSON.stringify(value)));
}

// --- 3. ACTIONS ---
export const addTask = (formData) => {
    const newTask = createTaskModel(formData);
    tasks.update(all => [...all, newTask]);
};

export const updateTask = (id, updates) => {
    tasks.update(all => all.map(t => t.id === id ? { ...t, ...updates } : t));
};

export const moveTask = (taskId, newStatus, targetIndex = -1) => {
    tasks.update(all => {
        const oldIndex = all.findIndex(t => t.id === taskId);
        if (oldIndex === -1) return all;

        const [task] = all.splice(oldIndex, 1);
        task.status = newStatus;

        if (targetIndex !== -1) {
            const safeIndex = Math.min(targetIndex, all.length);
            all.splice(safeIndex, 0, task);
        } else {
            all.push(task); 
        }
        return [...all]; 
    });
};

export const deleteTask = (id) => {
    tasks.update(all => all.filter(t => t.id !== id));
};

export const updateTaskProgress = (id, secondsToAdd) => {
    tasks.update(all => all.map(t => {
        if (t.id === id) {
            return { ...t, timeSpent: t.timeSpent + (secondsToAdd / 60) };
        }
        return t;
    }));
};