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
// endTime and startedAt are timestamps in ms (from timer store) for accuracy
export const logSession = (durationMinutes, taskId, taskTitle, endTime, startedAt) => {
    history.update(all => {
        const newLog = {
            id: Date.now(),
            date: endTime ? new Date(endTime).toISOString() : new Date().toISOString(),
            startedAt: startedAt ? new Date(startedAt).toISOString() : null,
            duration: durationMinutes,
            taskId,
            taskTitle
        };
        return [...all, newLog];
    });
};