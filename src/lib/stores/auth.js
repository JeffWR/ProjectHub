// src/lib/stores/auth.js
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';

// 1. The Store: Holds the user object (or null if logged out)
export const user = writable(null);

// 2. Auth Error Store
export const authError = writable(null);

// 3. Initial Check: When the app loads, see if we are already logged in
supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
        console.error('Error getting session:', error);
        authError.set(error.message);
    }
    user.set(session?.user || null);
}).catch((error) => {
    console.error('Failed to initialize auth:', error);
    authError.set('Failed to initialize authentication');
});

// 4. Listener: If the user logs in/out in a different tab or window, update this immediately
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.email || 'no user');
    user.set(session?.user || null);

    // Clear error on successful auth
    if (session?.user) {
        authError.set(null);
    }
});