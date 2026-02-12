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
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Validate and merge settings to prevent corruption
                if (parsed.settings) {
                    parsed.settings = {
                        pomodoro: Math.max(1, parseInt(parsed.settings.pomodoro) || defaultSettings.pomodoro),
                        short: Math.max(1, parseInt(parsed.settings.short) || defaultSettings.short),
                        long: Math.max(1, parseInt(parsed.settings.long) || defaultSettings.long)
                    };
                }
                initialData = { ...initialData, ...parsed };
            } catch (e) {
                console.warn('Failed to load timer state from localStorage:', e);
            }
        }
    }

    const store = writable(initialData);
    const { subscribe, update } = store;
    let interval;

    // --- BATCHING STRATEGY ---
    // Accumulate time locally and sync to server every SYNC_INTERVAL seconds
    const SYNC_INTERVAL = 10; // Sync every 10 seconds (industry standard)
    let pendingSeconds = 0; // Accumulated seconds not yet synced
    let lastSyncTick = 0; // Track ticks since last sync

    // --- SYNC ACCUMULATED TIME ---
    const syncAccumulatedTime = (forceSync = false) => {
        if (pendingSeconds === 0) return; // Nothing to sync

        const state = get(store);
        if (state.mode !== 'pomodoro') return; // Only track pomodoro time

        const currentTasks = get(tasks);
        const topTask = currentTasks.find(t => t.status === 'inprogress');

        if (topTask) {
            console.log(`📊 Syncing ${pendingSeconds}s to server (${forceSync ? 'forced' : 'batched'})`);
            updateTaskProgress(topTask.id, pendingSeconds);
            pendingSeconds = 0; // Reset after sync
            lastSyncTick = 0;
        }
    };

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

            // 2. ACCUMULATE TIME LOCALLY (don't sync yet)
            if (state.mode === 'pomodoro' && timeWorked > 0) {
                pendingSeconds += timeWorked;
                lastSyncTick += deltaSeconds;

                // Batch sync every SYNC_INTERVAL seconds
                if (lastSyncTick >= SYNC_INTERVAL) {
                    syncAccumulatedTime(false);
                }
            }

            // 3. STOP IF FINISHED
            if (newTimeLeft === 0) {
                // Sync any remaining time before stopping
                syncAccumulatedTime(true);

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
        // Sync any pending time before pausing
        syncAccumulatedTime(true);

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

    const setModeWithDuration = (mode, minutes) => {
        pause();
        // Ensure we have a valid positive number
        const safeMinutes = Math.max(1, parseInt(minutes) || 1);
        const newTimeLeft = safeMinutes * 60;
        console.log(`setModeWithDuration: mode=${mode}, minutes=${minutes}, safeMinutes=${safeMinutes}, newTimeLeft=${newTimeLeft}`);
        update(s => ({
            ...s,
            mode,
            timeLeft: newTimeLeft,
            settings: { ...s.settings, [mode]: safeMinutes }
        }));
    };

    // --- BROWSER VISIBILITY HANDLER ---
    // If the user leaves the tab and comes back, force an immediate update
    if (browser) {
        document.addEventListener('visibilitychange', () => {
            const state = get(store);
            if (document.visibilityState === 'hidden' && state.isRunning) {
                // Sync before tab becomes hidden
                syncAccumulatedTime(true);
            } else if (document.visibilityState === 'visible' && state.isRunning) {
                // Run the math immediately when returning
                tick();
            }
        });

        // Sync before page unload (close, refresh, navigate away)
        window.addEventListener('beforeunload', () => {
            syncAccumulatedTime(true);
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

    return { subscribe, start, pause, reset, setMode, setDuration, setModeWithDuration };
}

export const timer = createTimer();