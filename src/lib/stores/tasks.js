import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const initialTasks = browser && localStorage.getItem('tasks') 
    ? JSON.parse(localStorage.getItem('tasks')) 
    : [];

export const tasks = writable(initialTasks);
// We keep this variable, but we won't auto-set it from the Task page anymore
export const activeTaskId = writable(null);

if (browser) {
    tasks.subscribe(value => localStorage.setItem('tasks', JSON.stringify(value)));
}

export const addTask = (taskData) => {
    const totalMinutes = (parseInt(taskData.estHours || 0) * 60) + parseInt(taskData.estMinutes || 0);
    tasks.update(all => [
        ...all, 
        { 
            id: Date.now(),
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority,
            estTime: totalMinutes > 0 ? totalMinutes : 25,
            timeSpent: 0,
            status: 'todo',
            createdAt: new Date()
        }
    ]);
};

export const updateTaskProgress = (id, secondsToAdd) => {
    tasks.update(all => all.map(t => {
        if (t.id === id) return { ...t, timeSpent: t.timeSpent + (secondsToAdd / 60) };
        return t;
    }));
};

// MODIFIED: Just moves status, does NOT set activeTaskId
export const moveTask = (id, newStatus) => {
    tasks.update(all => all.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
    ));
};

export const deleteTask = (id) => {
    tasks.update(all => all.filter(t => t.id !== id));
};