import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Load from local storage if in browser
const initialTasks = browser && localStorage.getItem('tasks') 
    ? JSON.parse(localStorage.getItem('tasks')) 
    : [];

export const tasks = writable(initialTasks);
export const activeTaskId = writable(null); // ID of task we are focusing on

// Auto-save whenever tasks change
if (browser) {
    tasks.subscribe(value => localStorage.setItem('tasks', JSON.stringify(value)));
}

// Helper to add a task
export const addTask = (title, priority, category, estTime) => {
    tasks.update(all => [
        ...all, 
        { 
            id: Date.now(), 
            title, 
            priority, 
            category, 
            estTime, 
            completed: false, 
            subtasks: [] 
        }
    ]);
};