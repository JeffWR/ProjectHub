<script>
    import { toasts, dismissToast } from '$lib/stores/toast';
    import { fly } from 'svelte/transition';
    import { CheckCircle, AlertCircle, Info } from 'lucide-svelte';
</script>

<div class="toast-container">
    {#each $toasts as toast (toast.id)}
        <div
            class="toast toast-{toast.type || 'info'}"
            transition:fly={{ y: 50, duration: 300 }}
            on:click={() => dismissToast(toast.id)}
        >
            {#if toast.type === 'success'}
                <CheckCircle size={18} />
            {:else if toast.type === 'error'}
                <AlertCircle size={18} />
            {:else}
                <Info size={18} />
            {/if}
            <span>{toast.message}</span>
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    }

    .toast {
        background: white;
        color: #ba4949;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        cursor: pointer;
        font-family: 'Poppins', sans-serif;
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: auto;
    }

    .toast-success {
        background: #4caf50;
        color: white;
    }

    .toast-error {
        background: #f44336;
        color: white;
    }

    .toast-info {
        background: white;
        color: #ba4949;
    }
</style>