import { writable, get } from 'svelte/store';
import { updateTaskProgress, tasks } from './tasks'; 
import { browser } from '$app/environment';

const defaultSettings = {
    pomodoro: 25,
    short: 5,   
    long: 15
};

function createTimer() {
    // 1. INITIALIZE STATE
    let initialData = {
        timeLeft: defaultSettings.pomodoro * 60,
        isRunning: false,
        mode: 'pomodoro', 
        settings: defaultSettings,
        lastTick: null // NEW: Tracks the exact time of the last update
    };

    // Load from LocalStorage if available
    if (browser) {
        const saved = localStorage.getItem('timerState');
        if (saved) initialData = { ...initialData, ...JSON.parse(saved) };
    }

    const store = writable(initialData);
    const { subscribe, update } = store;
    let interval;

    // --- THE DELTA ENGINE ---
    const tick = () => {
        update(state => {
            if (!state.isRunning) return state;

            const now = Date.now();
            const lastTick = state.lastTick || now; // Fallback if null
            
            // Calculate how many seconds passed since the last frame (The Delta)
            const deltaMs = now - lastTick;
            
            // If less than 1 second passed, don't update yet (prevents micro-updates)
            if (deltaMs < 1000) return state;

            const deltaSeconds = Math.floor(deltaMs / 1000);

            // 1. CALCULATE NEW TIME
            let newTimeLeft = state.timeLeft - deltaSeconds;
            let timeWorked = deltaSeconds; // How much to credit the task

            // Clamp: If we passed 0, we stop there.
            if (newTimeLeft <= 0) {
                // Only credit the time it took to reach 0 (don't credit extra time)
                timeWorked = state.timeLeft; 
                newTimeLeft = 0;
            }

            // 2. UPDATE THE TASK (Synced exactly with the delta)
            if (state.mode === 'pomodoro' && timeWorked > 0) {
                const currentTasks = get(tasks);
                const topTask = currentTasks.find(t => t.status === 'inprogress');
                if (topTask) {
                    updateTaskProgress(topTask.id, timeWorked);
                }
            }

            // 3. STOP IF FINISHED
            if (newTimeLeft === 0) {
                // Stop the loop
                if (interval) clearInterval(interval);
                return { 
                    ...state, 
                    isRunning: false, 
                    timeLeft: 0,
                    lastTick: null
                };
            }

            // 4. SAVE STATE (Update lastTick to NOW, minus the remainder ms)
            // We subtract the remainder to keep the seconds smooth next time
            return { 
                ...state, 
                timeLeft: newTimeLeft,
                lastTick: now - (deltaMs % 1000) 
            };
        });
    };

    // --- ACTIONS ---

    const start = () => {
        const state = get(store);
        
        // Validation: Need a task for Pomodoro
        if (state.mode === 'pomodoro') {
            const allTasks = get(tasks);
            const hasFocusTask = allTasks.some(t => t.status === 'inprogress');
            // Optional: You can block start here if no task
        }

        if (state.isRunning) return;

        // Mark the start time immediately so the first tick is accurate
        update(s => ({ ...s, isRunning: true, lastTick: Date.now() }));
        
        if (interval) clearInterval(interval);
        
        // Run the tick check often (e.g., every 250ms or 1s). 
        // Since we use Math.floor(delta), running it faster won't speed up time, 
        // it just makes the UI more responsive when you switch tabs.
        interval = setInterval(tick, 1000);
    };

    const pause = () => {
        update(s => ({ ...s, isRunning: false, lastTick: null }));
        if (interval) clearInterval(interval);
    };

    const reset = () => {
        pause();
        update(s => ({ 
            ...s, 
            timeLeft: s.settings[s.mode] * 60,
            lastTick: null 
        }));
    };

    const setMode = (mode) => {
        pause();
        update(s => ({ 
            ...s, 
            mode, 
            timeLeft: s.settings[mode] * 60 
        }));
    };

    const setDuration = (minutes) => {
        const safeMinutes = parseInt(minutes) || 1;
        update(s => ({
            ...s,
            timeLeft: safeMinutes * 60,
            settings: { ...s.settings, [s.mode]: safeMinutes }
        }));
    };

    // --- BROWSER VISIBILITY HANDLER ---
    // If the user leaves the tab and comes back, force an immediate update
    if (browser) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                const state = get(store);
                if (state.isRunning) {
                    tick(); // Run the math immediately
                }
            }
        });

        // Save to LocalStorage on every change
        store.subscribe(val => {
            localStorage.setItem('timerState', JSON.stringify(val));
        });
    }

    // Resume on load
    const state = get(store);
    if (state.isRunning) {
        // If it was running, restart the interval
        interval = setInterval(tick, 1000);
    }

    return { subscribe, start, pause, reset, setMode, setDuration };
}

export const timer = createTimer();