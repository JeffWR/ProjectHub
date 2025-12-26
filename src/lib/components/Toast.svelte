<script>
    import { toasts, dismissToast } from '$lib/stores/toast';
    import { fly } from 'svelte/transition';
</script>

<div class="toast-container">
    {#each $toasts as toast (toast.id)}
        <div 
            class="toast" 
            transition:fly={{ y: 50, duration: 300 }}
            on:click={() => dismissToast(toast.id)}
        >
            {toast.message}
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
    }
</style>