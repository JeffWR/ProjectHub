// src/lib/stores/history.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// 1. Load existing history from LocalStorage
const initialHistory = browser && localStorage.getItem('history') 
    ? JSON.parse(localStorage.getItem('history')) 
    : [];

export const history = writable(initialHistory);

// 2. Auto-save to LocalStorage whenever history changes
if (browser) {
    history.subscribe(value => localStorage.setItem('history', JSON.stringify(value)));
}

// 3. Helper to log a new session
export const logSession = (minutes, taskId, taskTitle) => {
    history.update(all => [
        {
            id: Date.now(),
            date: new Date().toISOString(), // 2023-10-27T10:00:00.000Z
            duration: minutes,
            taskId,
            taskTitle
        },
        ...all // Add new item to the top
    ]);
};