<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        goto('/timer');
    });
</script>

<p style="opacity: 0.5; font-size: 0.8rem;">Loading Workspace...</p>