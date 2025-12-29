import { redirect } from '@sveltejs/kit';

export function load() {
    // This code runs on the server before the page loads.
    // It instantly redirects the user to '/tasks'.
    throw redirect(302, '/tasks');
}