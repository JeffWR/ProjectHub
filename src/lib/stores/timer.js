import { writable, get } from 'svelte/store';
import { updateTaskProgress, tasks } from './tasks'; 
import { logSession } from './history';
import { addToast } from './toast';

// FIX 1: Aligned keys with your UI ('short' instead of 'shortBreak')
const defaultSettings = {
    pomodoro: 25,
    short: 5,   
    long: 15
};

function createTimer() {
    // Create the store object first so we can read it inside functions
    const store = writable({
        timeLeft: defaultSettings.pomodoro * 60,
        isRunning: false,
        mode: 'pomodoro', 
        settings: defaultSettings
    });

    const { subscribe, update } = store;
    let interval;

    const start = () => {
        const state = get(store);

        // FIX 2: Only force a task if we are in 'pomodoro' mode.
        // Breaks should just start immediately.
        if (state.mode === 'pomodoro') {
            const allTasks = get(tasks);
            const focusTasks = allTasks.filter(t => t.status === 'inprogress');
            
            if (focusTasks.length === 0) {
                 addToast('Drag a task to "In Focus" to start working!', 'info');
                 return; 
            }
        }

        // Prevent double-clicking start
        if (state.isRunning) return;

        update(s => ({ ...s, isRunning: true }));
        
        interval = setInterval(() => {
            update(currentState => {
                // 1. STOP if time is up
                if (currentState.timeLeft <= 0) {
                    clearInterval(interval);
                    
                    // Only log history for Pomodoros, not breaks
                    if (currentState.mode === 'pomodoro') {
                        const currentTasks = get(tasks);
                        const topTask = currentTasks.find(t => t.status === 'inprogress');
                        
                        if (topTask) {
                            logSession(currentState.settings.pomodoro, topTask.id, topTask.title);
                            addToast(`Session Complete! Take a break.`, 'success');
                        }
                    } else {
                        addToast(`Break over! Back to work.`, 'info');
                    }

                    return { 
                        ...currentState, 
                        isRunning: false, 
                        timeLeft: currentState.settings[currentState.mode] * 60 
                    }; 
                }

                // 2. TRACK PROGRESS (Only if in Pomodoro mode)
                if (currentState.mode === 'pomodoro') {
                    const currentTasks = get(tasks);
                    const topTask = currentTasks.find(t => t.status === 'inprogress');

                    if (topTask) {
                        updateTaskProgress(topTask.id, 1); 
                    } else {
                        // If task is removed during timer, pause it
                        clearInterval(interval);
                        return { ...currentState, isRunning: false };
                    }
                }

                return { ...currentState, timeLeft: currentState.timeLeft - 1 };
            });
        }, 1000);
    };

    const pause = () => {
        update(s => ({ ...s, isRunning: false }));
        clearInterval(interval);
    };

    const reset = () => {
        pause();
        update(s => ({ ...s, timeLeft: s.settings[s.mode] * 60 }));
    };

    const setMode = (mode) => {
        pause();
        update(s => ({ 
            ...s, 
            mode, 
            // This now correctly finds 'short' or 'long' in settings
            timeLeft: s.settings[mode] * 60 
        }));
    };

    return { subscribe, start, pause, reset, setMode };
}

export const timer = createTimer();