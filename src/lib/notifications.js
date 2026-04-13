/**
 * notifications.js
 * Thin wrapper around the browser Notification API.
 * All functions are no-ops when:
 *   - Not in a browser environment
 *   - The user has blocked notifications
 *   - The user has turned notifications off in settings
 */

import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { settings } from '$lib/stores/settings';

// ── Permission ───────────────────────────────────────────────────────────────

/**
 * Ask the browser for notification permission.
 * Returns the resulting permission string: 'granted' | 'denied' | 'default'
 */
export async function requestPermission() {
    if (!browser || !('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
}

/**
 * Returns true if notifications are both permitted by the browser
 * AND turned on in the user's app settings.
 */
export function notificationsEnabled() {
    if (!browser || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;
    const s = get(settings);
    return s?.notifications === true;
}

// ── Fire ─────────────────────────────────────────────────────────────────────

/**
 * Show a browser notification.
 * Silently skips if permission is missing or feature is disabled in settings.
 *
 * @param {string} title  — Bold heading line
 * @param {string} body   — Supporting detail text
 * @param {string} [icon] — Optional icon URL (defaults to /favicon.png)
 */
export function notify(title, body, icon = '/favicon.png') {
    if (!notificationsEnabled()) return;

    try {
        const n = new Notification(title, {
            body,
            icon,
            // Keep it visible until the user dismisses it
            requireInteraction: false,
            // Collapse duplicate notifications (e.g. if multiple tabs are open)
            tag: 'projecthub-timer',
            // Vibrate on mobile devices that support it
            vibrate: [200, 100, 200]
        });

        // Auto-close after 6 seconds so it doesn't linger
        setTimeout(() => n.close(), 6000);
    } catch (e) {
        // Non-fatal — notifications are a nice-to-have
        console.warn('[notifications] Failed to show notification:', e);
    }
}

// ── Presets ──────────────────────────────────────────────────────────────────

/**
 * Fire the "Pomodoro session complete" notification.
 * @param {string} [taskTitle]
 */
export function notifyPomodoroComplete(taskTitle) {
    const body = taskTitle
        ? `Great work on "${taskTitle}"! Time to take a break.`
        : 'Great work! Time to take a break.';
    notify('🍅 Session Complete!', body);
}

/**
 * Fire the "Break is over" notification.
 */
export function notifyBreakComplete() {
    notify('⏰ Break Over', "Time to get back to work. You've got this!");
}
