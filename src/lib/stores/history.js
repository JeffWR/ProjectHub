import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initial Load
const initialHistory = browser && localStorage.getItem('pomodoroHistory') 
    ? JSON.parse(localStorage.getItem('pomodoroHistory')) 
    : [];

export const history = writable(initialHistory);

// Subscribe to save to localStorage
if (browser) {
    history.subscribe(val => localStorage.setItem('pomodoroHistory', JSON.stringify(val)));
}

// Action: Log a completed session
export const logSession = (durationMinutes, taskId, taskTitle) => {
    history.update(all => {
        const newLog = {
            id: Date.now(),
            date: new Date().toISOString(), // Full timestamp
            duration: durationMinutes,
            taskId,
            taskTitle
        };
        return [...all, newLog];
    });
};