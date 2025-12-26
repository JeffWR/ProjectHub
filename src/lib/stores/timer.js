import { writable, get } from 'svelte/store';
import { updateTaskProgress, tasks } from './tasks'; 
import { logSession } from './history';
import { addToast } from './toast';

const defaultSettings = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
};

function createTimer() {
    const { subscribe, set, update } = writable({
        timeLeft: defaultSettings.pomodoro * 60,
        isRunning: false,
        mode: 'pomodoro', 
        settings: defaultSettings
    });

    let interval;

    const start = () => {
        // Validation: Can't start if Focus column is empty
        const allTasks = get(tasks);
        const focusTasks = allTasks.filter(t => t.status === 'inprogress');
        
        if (focusTasks.length === 0) {
             addToast('Drag a task to "In Focus" to start!', 'info');
             return; 
        }

        update(s => ({ ...s, isRunning: true }));
        
        interval = setInterval(() => {
            update(state => {
                // 1. STOP if time is up
                if (state.timeLeft <= 0) {
                    clearInterval(interval);
                    
                    if (state.mode === 'pomodoro') {
                        // Log the session for the TOP task
                        const currentTasks = get(tasks);
                        const topTask = currentTasks.filter(t => t.status === 'inprogress')[0];
                        
                        if (topTask) {
                            logSession(state.settings.pomodoro, topTask.id, topTask.title);
                            addToast(`Session Complete!`, 'success');
                        }
                    }
                    return { ...state, isRunning: false, timeLeft: state.settings[state.mode] * 60 }; 
                }

                // 2. TRACK PROGRESS (Every second)
                if (state.mode === 'pomodoro') {
                    const currentTasks = get(tasks);
                    // GRAB THE TOP TASK
                    const topTask = currentTasks.filter(t => t.status === 'inprogress')[0];

                    if (topTask) {
                        updateTaskProgress(topTask.id, 1); 
                    } else {
                        // If the list became empty while running, pause.
                        clearInterval(interval);
                        return { ...state, isRunning: false };
                    }
                }

                return { ...state, timeLeft: state.timeLeft - 1 };
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
        update(s => ({ ...s, mode, timeLeft: s.settings[mode] * 60 }));
    };

    return { subscribe, start, pause, reset, setMode };
}

export const timer = createTimer();