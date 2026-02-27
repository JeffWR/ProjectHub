import { get } from 'svelte/store';
import { timer } from '$lib/stores/timer';
import { settings } from '$lib/stores/settings';
import { logSession } from '$lib/stores/history';
import { tick } from 'svelte';

/**
 * Decides what happens when the timer hits 0.
 * Returns an object telling the UI if it needs to show the completion modal.
 */
export async function handleTimerCompletion(heroTask, completedTodayCount) {
    const currentMode = get(timer).mode;
    const currentSettings = get(settings);

    // 1. If Pomodoro finished, log it, reset, and request Modal
    if (currentMode === 'pomodoro') {
        // Read timestamps before reset clears them
        const timerState = get(timer);
        logSession(
            currentSettings?.pomodoro || 25,
            heroTask?.id,
            heroTask?.title || 'Focus',
            timerState.completedAt,  // Exact moment timer hit 0
            timerState.startedAt     // Exact moment timer was first started
        );
        timer.reset(); // Reset pomodoro timer for next session
        return { shouldShowModal: true };
    }

    // 2. If Break finished, automatically move to next phase (which will set correct duration)
    // IMPORTANT: Wait for Svelte to process the "timer hit 0" state before advancing
    await tick();
    console.log('[handleTimerCompletion] Break finished, advancing to next phase...');
    await advancePhase(completedTodayCount);
    return { shouldShowModal: false };
}

/**
 * Calculates the next phase (Short Break vs Long Break vs Pomodoro)
 * and starts the timer if autoStart is on.
 */
export async function advancePhase(completedTodayCount) {
    const currentMode = get(timer).mode;
    const currentSettings = get(settings);
    
    if (currentMode === 'pomodoro') {
        // We just finished a Pomodoro, time for a break.
        const interval = currentSettings?.longBreakInterval || 4;
        
        if (completedTodayCount > 0 && completedTodayCount % interval === 0) {
            applyMode('long');
        } else {
            applyMode('short');
        }
    } else {
        // Break is over, back to work.
        applyMode('pomodoro');
    }

    // Handle Auto-start
    if (currentSettings?.autoStart) {
        await tick();
        timer.start();
    }
}

/**
 * Sets the mode (pomodoro/short/long) and updates duration from settings.
 * Uses a single atomic update to prevent UI flicker.
 */
export function applyMode(mode) {
    const timerState = get(timer);
    const globalSettings = get(settings);

    // Validate mode parameter
    if (!['pomodoro', 'short', 'long'].includes(mode)) {
        console.warn(`Invalid timer mode: ${mode}, defaulting to pomodoro`);
        mode = 'pomodoro';
    }

    // Use timer.settings (user's customized durations) first, fall back to global settings
    // Important: Use explicit undefined check because 0 is falsy but valid
    let duration;

    if (mode === 'pomodoro') {
        duration = timerState?.settings?.pomodoro ?? globalSettings?.pomodoro ?? 25;
    } else if (mode === 'short') {
        duration = timerState?.settings?.short ?? globalSettings?.shortBreak ?? 5;
    } else if (mode === 'long') {
        duration = timerState?.settings?.long ?? globalSettings?.longBreak ?? 15;
    }

    // Ensure duration is a valid positive number with multiple fallbacks
    const parsedDuration = parseInt(duration);
    const safeDuration = (parsedDuration > 0) ? parsedDuration : 25;

    console.log(`applyMode: mode=${mode}, duration=${safeDuration}, timerSettings=`, timerState?.settings);

    // Set mode and duration in a single atomic update to prevent showing 0
    timer.setModeWithDuration(mode, safeDuration);
}