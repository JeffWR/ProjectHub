import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const initialTasks = browser && localStorage.getItem('tasks') 
    ? JSON.parse(localStorage.getItem('tasks')) 
    : [];

export const tasks = writable(initialTasks);

if (browser) {
    tasks.subscribe(value => localStorage.setItem('tasks', JSON.stringify(value)));
}

export const addTask = (taskData) => {
    const totalMinutes = (parseInt(taskData.estHours || 0) * 60) + parseInt(taskData.estTime || 25);
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

export const updateTaskDetails = (id, data) => {
    tasks.update(all => all.map(t => t.id === id ? { ...t, ...data } : t));
};

export const updateTaskProgress = (id, secondsToAdd) => {
    tasks.update(all => all.map(t => {
        if (t.id === id) return { ...t, timeSpent: t.timeSpent + (secondsToAdd / 60) };
        return t;
    }));
};

export const deleteTask = (id) => {
    tasks.update(all => all.filter(t => t.id !== id));
};

// LOGIC: Handles moving AND reordering
export const moveTask = (taskId, newStatus, targetIndex = -1) => {
    tasks.update(all => {
        const oldIndex = all.findIndex(t => t.id === taskId);
        if (oldIndex === -1) return all;

        // 1. Remove from old spot
        const [task] = all.splice(oldIndex, 1);
        task.status = newStatus;

        // 2. Insert into new spot
        // If targetIndex is provided, insert there. Otherwise add to bottom.
        if (targetIndex !== -1) {
            // Safety clamp to ensure we don't insert way outside the array
            const safeIndex = Math.min(targetIndex, all.length);
            all.splice(safeIndex, 0, task);
        } else {
            all.push(task); 
        }
        
        return [...all]; 
    });
};