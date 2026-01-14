// src/lib/components/ui/transitions.js

import { crossfade } from 'svelte/transition';
import { cubicOut, quintOut } from 'svelte/easing';

//The Morphing Effect (Transition between small timer and focusmode overlay)
export const [send, receive] = crossfade({
    duration: 1000, 
    easing: quintOut,
    fallback: scale
});

//The Scaling Effect (Used as a fallback for crossfade)
function scale(node, { duration }) {
    return {
        duration: 1000,
        css: t => `transform: scale(${t}); opacity: ${t}`
    };
}

//The Background Explosion Effect (Expanding circle animation)
export function growWithGradient(node, { duration }) {
    return {
        duration,
        css: t => {
            const eased = cubicOut(t);
            return `transform: scale(${eased * 4}); opacity: ${eased};`;
        }
    };
}