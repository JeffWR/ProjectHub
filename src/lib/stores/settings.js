import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const defaultSettings = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStart: false,
    longBreakInterval: 4,

    // Theme is localStorage-only — each device keeps its own preference.
    // Valid values are keys of the `themes` object in src/lib/themes.js.
    theme: 'pomodoro',
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