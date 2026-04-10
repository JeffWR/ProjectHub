import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { user } from '$lib/stores/auth';

// ── Local cache helpers ──────────────────────────────────────────────────────

const CACHE_KEY = 'pomodoroHistory';

function readCache() {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function writeCache(sessions) {
	if (!browser) return;
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(sessions));
	} catch {
		// storage full — not fatal
	}
}

// ── Store ────────────────────────────────────────────────────────────────────

export const history = writable(readCache());

// Keep local cache in sync whenever the store changes
if (browser) {
	history.subscribe(writeCache);
}

// ── Map a Supabase row → the shape the rest of the app expects ───────────────

function rowToSession(row) {
	return {
		id: row.id,
		date: row.date,
		startedAt: row.started_at ?? null,
		duration: row.duration,
		taskId: row.task_id ?? null,
		taskTitle: row.task_title ?? 'Focus'
	};
}

// ── Load all sessions for the current user from Supabase ────────────────────

export async function loadHistory() {
	const currentUser = get(user);
	if (!currentUser) return;

	const { data, error } = await supabase
		.from('pomodoro_sessions')
		.select('*')
		.eq('user_id', currentUser.id)
		.order('date', { ascending: false });

	if (error) {
		console.error('[history] Failed to load from Supabase:', error.message);
		// Fall back to whatever is already in the cache
		return;
	}

	const sessions = (data ?? []).map(rowToSession);
	history.set(sessions);
}

// ── Log a completed session (write to Supabase + update store) ───────────────

export const logSession = async (durationMinutes, taskId, taskTitle, endTime, startedAt) => {
	const newSession = {
		// Temporary numeric id so the UI can render immediately
		id: Date.now(),
		date: endTime ? new Date(endTime).toISOString() : new Date().toISOString(),
		startedAt: startedAt ? new Date(startedAt).toISOString() : null,
		duration: durationMinutes,
		taskId: taskId ?? null,
		taskTitle: taskTitle ?? 'Focus'
	};

	// 1. Optimistic update — show it instantly in the UI
	history.update((all) => [newSession, ...all]);

	// 2. Persist to Supabase
	const currentUser = get(user);
	if (!currentUser) {
		// Not logged in — local-only, that's fine
		return;
	}

	const { data, error } = await supabase
		.from('pomodoro_sessions')
		.insert({
			user_id: currentUser.id,
			task_id: taskId ?? null,
			task_title: taskTitle ?? 'Focus',
			duration: durationMinutes,
			date: newSession.date,
			started_at: newSession.startedAt
		})
		.select()
		.single();

	if (error) {
		console.error('[history] Failed to save session to Supabase:', error.message);
		// Leave the optimistic entry — it's still in localStorage as a fallback
		return;
	}

	// 3. Replace the temporary numeric id with the real UUID from Supabase
	history.update((all) => all.map((s) => (s.id === newSession.id ? rowToSession(data) : s)));
};

// ── Re-load whenever the logged-in user changes ──────────────────────────────

if (browser) {
	user.subscribe((currentUser) => {
		if (currentUser) {
			loadHistory();
		} else {
			// Logged out — clear to avoid showing another user's data
			history.set([]);
			writeCache([]);
		}
	});
}
