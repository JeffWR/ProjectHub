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

    // 1. If Pomodoro finished, log it and request Modal
    if (currentMode === 'pomodoro') {
        logSession(
            currentSettings?.pomodoro || 25, 
            heroTask?.id, 
            heroTask?.title || 'Focus'
        );
        return { shouldShowModal: true };
    } 
    
    // 2. If Break finished, automatically move to next phase
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
        // Check if we hit the long break interval.
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
 */
export function applyMode(mode) {
    const s = get(settings);
    timer.setMode(mode);
    
    let duration = 25;
    if (mode === 'pomodoro') duration = s?.pomodoro || 25;
    if (mode === 'short') duration = s?.shortBreak || 5;
    if (mode === 'long') duration = s?.longBreak || 15;
    
    timer.setDuration(duration);
}