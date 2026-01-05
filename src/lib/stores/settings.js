import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const defaultSettings = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStart: false,
    
    // NEW: How many Pomodoros before a long break?
    longBreakInterval: 4 
};

const initialSettings = browser && localStorage.getItem('settings')
    ? { ...defaultSettings, ...JSON.parse(localStorage.getItem('settings')) }
    : defaultSettings;

export const settings = writable(initialSettings);

if (browser) {
    settings.subscribe(value => {
        localStorage.setItem('settings', JSON.stringify(value));
    });
}