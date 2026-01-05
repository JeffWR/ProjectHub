<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    const dispatch = createEventDispatcher();
</script>

<div class="fullscreen-overlay" transition:fade={{ duration: 200 }}>
    <div class="glass-modal" in:scale={{ start: 0.9, duration: 300, delay: 100 }}>
        <div class="modal-icon">🎉</div>
        <h2>Session Complete!</h2>
        <p>Congratulations! You've focused hard. It's time to recharge your brain.</p>
        
        <div class="modal-actions">
            <button class="btn-break" on:click={() => dispatch('takeBreak')}>
                Take a Break ☕
            </button>
            <button class="btn-skip" on:click={() => dispatch('skipBreak')}>
                Skip Break (Continue Working)
            </button>
        </div>
    </div>
</div>

<style>
    .fullscreen-overlay {
        position: fixed; inset: 0;
        background: rgba(15, 15, 15, 0.85);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex; justify-content: center; align-items: center;
    }

    .glass-modal {
        background: rgba(20, 20, 20, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 24px;
        padding: 40px;
        width: 90%; max-width: 450px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .modal-icon { font-size: 3rem; margin-bottom: 15px; }
    
    h2 { color: white; font-size: 1.8rem; margin: 0 0 10px 0; font-weight: 800; }
    
    p { color: rgba(255, 255, 255, 0.7); font-size: 1rem; margin-bottom: 30px; line-height: 1.5; }
    
    .modal-actions { display: flex; flex-direction: column; gap: 15px; }
    
    .btn-break {
        background: #4caf50; color: white; border: none; padding: 16px; border-radius: 12px;
        font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: transform 0.1s;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    }
    .btn-break:hover { transform: translateY(-2px); background: #43a047; }
    
    .btn-skip {
        background: transparent; color: rgba(255, 255, 255, 0.6); border: 2px solid rgba(255, 255, 255, 0.1);
        padding: 14px; border-radius: 12px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: 0.2s;
    }
    .btn-skip:hover { border-color: rgba(255, 255, 255, 0.3); color: white; background: rgba(255, 255, 255, 0.05); }
</style>