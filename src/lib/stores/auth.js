// src/lib/stores/auth.js
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';

// 1. The Store: Holds the user object (or null if logged out)
export const user = writable(null);

// 2. Initial Check: When the app loads, see if we are already logged in
supabase.auth.getSession().then(({ data: { session } }) => {
    user.set(session?.user || null);
});

// 3. Listener: If the user logs in/out in a different tab or window, update this immediately
supabase.auth.onAuthStateChange((_event, session) => {
    user.set(session?.user || null);
});