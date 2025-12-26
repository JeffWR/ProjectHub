import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const initialTasks = browser && localStorage.getItem('tasks') 
    ? JSON.parse(localStorage.getItem('tasks')) 
    : [];

export const tasks = writable(initialTasks);
export const activeTaskId = writable(null);

if (browser) {
    tasks.subscribe(value => localStorage.setItem('tasks', JSON.stringify(value)));
}

export const addTask = (taskData) => {
    // Handle both minutes input or combined hours/minutes if you expand later
    const totalMinutes = (parseInt(taskData.estHours || 0) * 60) + parseInt(taskData.estTime || 25);
    
    tasks.update(all => [
        ...all, 
        { 
            id: Date.now(),
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority,
            estTime: totalMinutes,
            timeSpent: 0,
            status: 'todo',
            createdAt: new Date()
        }
    ]);
};

// NEW: Updates title, description, etc. without changing status/progress
export const updateTaskDetails = (id, data) => {
    tasks.update(all => all.map(t => 
        t.id === id ? { ...t, ...data } : t
    ));
};

export const updateTaskProgress = (id, secondsToAdd) => {
    tasks.update(all => all.map(t => {
        if (t.id === id) return { ...t, timeSpent: t.timeSpent + (secondsToAdd / 60) };
        return t;
    }));
};

export const moveTask = (id, newStatus) => {
    tasks.update(all => all.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
    ));

    // CRITICAL FIX: Syncs the "Active Task" with the "In Progress" column
    if (newStatus === 'inprogress') {
        activeTaskId.set(id);
    } else {
        // If moving out of progress, stop the specific task timer
        activeTaskId.update(currentId => currentId === id ? null : currentId);
    }
};

export const deleteTask = (id) => {
    tasks.update(all => all.filter(t => t.id !== id));
    activeTaskId.update(current => current === id ? null : current);
};