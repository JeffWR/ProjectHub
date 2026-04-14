/**
 * notifications.js
 * Thin wrapper around the browser Notification API.
 * All functions are no-ops when:
 *   - Not in a browser environment
 *   - The user has blocked notifications
 *   - The user has turned notifications off in settings
 *
 * SOUNDS
 *   Place audio files in /static/sounds/:
 *     - done.mp3       → plays when a Pomodoro session completes
 *     - break-over.mp3 → plays when a break ends
 *
 * ICON
 *   Place a 192×192 PNG at /static/notification-icon.png
 *   The browser Notification API requires a raster image (not SVG).
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

// ── Sound ────────────────────────────────────────────────────────────────────

/**
 * Play a short audio file from /static/sounds/.
 * Falls back silently if the file is missing or autoplay is blocked.
 *
 * @param {string} filename — e.g. 'done.mp3'
 */
function playSound(filename) {
	if (!browser) return;
	try {
		const audio = new Audio(`/sounds/${filename}`);
		// Keep volume reasonable — not a jump-scare
		audio.volume = 0.5;
		audio.play().catch(() => {
			// Autoplay may be blocked before the user has interacted with the page.
			// This is non-fatal — the visual notification still fires.
		});
	} catch (e) {
		console.warn('[notifications] Could not play sound:', e);
	}
}

// ── Fire ─────────────────────────────────────────────────────────────────────

/**
 * Show a browser notification and optionally play a sound.
 * Silently skips if permission is missing or the feature is disabled in settings.
 *
 * @param {string} title    — Bold heading line
 * @param {string} body     — Supporting detail text
 * @param {string} [sound]  — Filename inside /static/sounds/ to play (e.g. 'done.mp3')
 */
export function notify(title, body, sound = null) {
	if (!notificationsEnabled()) return;

	// ── Browser notification ─────────────────────────────────────────────────
	try {
		const n = new Notification(title, {
			body,
			// 192×192 PNG — convert your favicon.svg to PNG and place it here.
			// The Notification API does not support SVG icons.
			icon: '/notification-icon.png',
			// Collapse duplicate notifications when multiple tabs are open
			tag: 'projecthub-timer',
			// Let the OS decide how long to show it (platform default)
			requireInteraction: false,
			// Vibrate pattern for Android: buzz 200ms, pause 100ms, buzz 200ms
			vibrate: [200, 100, 200]
		});

		// Auto-close after 6 seconds so it doesn't linger
		setTimeout(() => n.close(), 6000);
	} catch (e) {
		console.warn('[notifications] Failed to show notification:', e);
	}

	// ── Sound ────────────────────────────────────────────────────────────────
	if (sound) {
		playSound(sound);
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
	notify('🍅 Session Complete!', body, 'done.mp3');
}

/**
 * Fire the "Break is over" notification.
 */
export function notifyBreakComplete() {
	notify('⏰ Break Over', "Time to get back to work. You've got this!", 'break-over.mp3');
}
