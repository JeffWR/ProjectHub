import { writable, get } from 'svelte/store';
import { updateTaskProgress, tasks } from './tasks'; 

const defaultSettings = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
};

function createTimer() {
    const { subscribe, set, update } = writable({
        timeLeft: defaultSettings.pomodoro * 60,
        isRunning: false,
        mode: 'pomodoro', // 'pomodoro', 'shortBreak', 'longBreak'
        settings: defaultSettings
    });

    let interval;

    const start = () => {
        update(s => ({ ...s, isRunning: true }));
        
        interval = setInterval(() => {
            update(state => {
                // 1. STOP if time is up
                if (state.timeLeft <= 0) {
                    clearInterval(interval);
                    return { ...state, isRunning: false, timeLeft: state.settings[state.mode] * 60 }; 
                }

                // 2. TRACK PROGRESS (Only if in Pomodoro mode)
                if (state.mode === 'pomodoro') {
                    const allTasks = get(tasks);
                    
                    // --- MAGIC FIX ---
                    // Find the FIRST task that is 'inprogress'. This is our "Hero" task.
                    const activeTask = allTasks.find(t => t.status === 'inprogress');
                    
                    if (activeTask) {
                        updateTaskProgress(activeTask.id, 1);
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
        update(s => ({ 
            ...s, 
            mode, 
            timeLeft: s.settings[mode] * 60 
        }));
    };

    return { subscribe, start, pause, reset, setMode };
}

export const timer = createTimer();