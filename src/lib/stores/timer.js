// src/lib/stores/timer.js
import { writable, get } from 'svelte/store';
import { logSession } from './history';
import { activeTaskId, tasks } from './tasks';
import { addToast } from './toast';

// Default Settings
const defaultState = {
    timeLeft: 25 * 60,
    mode: 'pomodoro', // 'pomodoro', 'short', 'long'
    isRunning: false,
    settings: { pomodoro: 25, short: 5, long: 15 }
};

const createTimerStore = () => {
    const { subscribe, update, set } = writable(defaultState);
    let interval;

    return {
        subscribe,
        start: () => update(s => {
            if (s.isRunning) return s;
            
            // Start the interval
            interval = setInterval(() => {
                update(state => {
                    // 1. If time remains, decrease it
                    if (state.timeLeft > 0) {
                        return { ...state, timeLeft: state.timeLeft - 1 };
                    }
                    
                    // 2. TIME IS UP!
                    clearInterval(interval);
                    
                    // 3. Get info to log the session
                    const currentTaskId = get(activeTaskId);
                    const allTasks = get(tasks);
                    const taskTitle = allTasks.find(t => t.id === currentTaskId)?.title || 'Unspecified Task';

                    // 4. Save to History (Only if it was a Pomodoro, usually we don't log breaks)
                    if (state.mode === 'pomodoro') {
                        logSession(state.settings.pomodoro, currentTaskId, taskTitle);
                        // Optional: Browser notification or sound could go here
                        addToast(`Great Job! You completed: ${taskTitle}`, 'success');
                    }

                    // 5. Reset timer state
                    return { 
                        ...state, 
                        isRunning: false, 
                        timeLeft: state.settings[state.mode] * 60 
                    }; 
                });
            }, 1000);

            return { ...s, isRunning: true };
        }),
        pause: () => update(s => {
            clearInterval(interval);
            return { ...s, isRunning: false };
        }),
        reset: () => update(s => {
            clearInterval(interval);
            return { ...s, isRunning: false, timeLeft: s.settings[s.mode] * 60 };
        }),
        setMode: (mode) => update(s => {
            clearInterval(interval);
            return { 
                ...s, 
                mode, 
                isRunning: false, 
                timeLeft: s.settings[mode] * 60 
            };
        }),
        updateSettings: (newSettings) => update(s => ({ ...s, settings: newSettings }))
    };
};

export const timer = createTimerStore();