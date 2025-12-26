import { writable } from 'svelte/store';

export const toasts = writable([]);

export const addToast = (message, type = 'info') => {
    const id = Date.now();
    // Add new toast to the array
    toasts.update((all) => [...all, { id, message, type }]);

    // Remove it automatically after 3 seconds
    setTimeout(() => {
        dismissToast(id);
    }, 3000);
};

export const dismissToast = (id) => {
    toasts.update((all) => all.filter((t) => t.id !== id));
};