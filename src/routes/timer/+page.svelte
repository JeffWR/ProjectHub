<script>
    import { timer } from '$lib/stores/timer';
    import { tasks, heroTask } from '$lib/stores/tasks';
    import { tick } from 'svelte';
    
    // --- DISPLAY LOGIC ---
    $: minutes = Math.floor($timer.timeLeft / 60);
    $: seconds = $timer.timeLeft % 60;
    $: displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    $: activeTask = $heroTask;

    // --- TIMELINE CONFIG ---
    let isEditing = false;
    let scrollContainer;
    let currentMinutes = 25;
    
    // ALIGNMENT CONFIG
    const TICK_WIDTH = 50; 
    const MAX_TIME = 120;  

    // --- EDIT MODE START ---
    async function startEditing() {
        if ($timer.isRunning) return; 
        
        isEditing = true;
        currentMinutes = Math.floor($timer.timeLeft / 60);
        
        await tick();
        
        if (scrollContainer) {
            // Force alignment: Minute 1 starts at 0 scroll
            const targetScroll = (currentMinutes - 1) * TICK_WIDTH;
            scrollContainer.scrollLeft = targetScroll;
        }
    }

    // --- SCROLL HANDLER (Read Value) ---
    function handleScroll() {
        if (!scrollContainer) return;
        const scrollLeft = scrollContainer.scrollLeft;
        
        // Convert pixels to minutes
        let rawValue = Math.round(scrollLeft / TICK_WIDTH) + 1;
        currentMinutes = Math.max(1, Math.min(MAX_TIME, rawValue));
    }

    // --- GLOBAL DRAG PHYSICS ---
    let isDragging = false;
    let startX, startScrollLeft;

    function onMouseDown(e) {
        // Only drag if we are in Edit Mode
        if (!isEditing) return;
        
        // Don't drag if clicking the "Set Time" button
        if (e.target.closest('button')) return;

        isDragging = true;
        startX = e.pageX;
        // We need to read the scroll container's state, but we clicked anywhere on screen
        if (scrollContainer) {
            startScrollLeft = scrollContainer.scrollLeft;
            scrollContainer.style.scrollSnapType = 'none'; // Disable snap for smoothness
        }
        document.body.style.cursor = 'grabbing';
    }

    function onMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        
        // Re-enable snap to magnetize
        if (scrollContainer) scrollContainer.style.scrollSnapType = 'x mandatory';
        document.body.style.cursor = 'default';
    }

    function onMouseMove(e) {
        if (!isDragging || !scrollContainer) return;
        e.preventDefault();
        
        const x = e.pageX;
        const walk = (x - startX) * 1.5; // 1.5x Speed factor
        
        // Drag Left -> Move Content Left -> Reveal Higher Numbers
        scrollContainer.scrollLeft = startScrollLeft - walk;
    }

    // --- SAVE ---
    function saveEdit() {
        timer.setDuration(currentMinutes);
        isEditing = false;
    }
</script>

<svelte:window 
    on:mousedown={onMouseDown}
    on:mousemove={onMouseMove} 
    on:mouseup={onMouseUp}
/>

<div class="glass-panel" class:hidden={isEditing}>
    <div class="task-pill">
        {#if activeTask}
            <span class="active-dot">●</span> Working on: <strong>{activeTask.title}</strong>
        {:else}
            <span class="inactive">Drag a task to "In Focus" to start</span>
        {/if}
    </div>

    <h1 class="timer-digits" on:dblclick={startEditing} title="Double-click to edit">
        {displayTime}
    </h1>

    <div class="controls">
        <button class="btn-main" on:click={$timer.isRunning ? timer.pause : timer.start}>
            {$timer.isRunning ? 'PAUSE' : 'START'}
        </button>
        <button class="btn-sec" on:click={timer.reset}>RESET</button>
    </div>

    <div class="modes">
        <button on:click={() => timer.setMode('pomodoro')} class:active={$timer.mode === 'pomodoro'}>Pomodoro</button>
        <button on:click={() => timer.setMode('short')} class:active={$timer.mode === 'short'}>Short Break</button>
        <button on:click={() => timer.setMode('long')} class:active={$timer.mode === 'long'}>Long Break</button>
    </div>
</div>

{#if isEditing}
    <div class="fullscreen-overlay">
        <div class="overlay-content">
            
            <div class="edit-readout">
                <span class="val">{currentMinutes}</span>
                <span class="lbl">min</span>
            </div>

            <div class="ruler-container">
                <div class="center-line"></div>

                <div 
                    class="scroll-track"
                    bind:this={scrollContainer}
                    on:scroll={handleScroll}
                >
                    <div class="spacer" style="flex: 0 0 calc(50% - {TICK_WIDTH / 2}px);"></div>

                    {#each Array(MAX_TIME) as _, i}
                        <div class="tick-group" style="width: {TICK_WIDTH}px">
                            {#if (i + 1) % 5 === 0}
                                <div class="tick major"></div>
                                <span class="tick-label">{i + 1}</span>
                            {:else}
                                <div class="tick minor"></div>
                            {/if}
                        </div>
                    {/each}
                    
                    <div class="spacer" style="flex: 0 0 calc(50% - {TICK_WIDTH / 2}px);"></div>
                </div>
            </div>

            <button class="save-btn" on:click={saveEdit}>SET TIME</button>
        </div>
    </div>
{/if}

<style>
    /* --- GLASS PANEL (Normal State) --- */
    .glass-panel {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 30px;
        width: 100%; max-width: 600px;
        aspect-ratio: 4/3;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        text-align: center;
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    /* FADE OUT when editing (Fixes the "Box Behind" issue) */
    .glass-panel.hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.95);
    }

    /* --- FULLSCREEN OVERLAY (Edit State) --- */
    .fullscreen-overlay {
        position: fixed; inset: 0;
        background: rgba(15, 15, 15, 0.9); /* Darker background for focus */
        backdrop-filter: blur(20px);
        z-index: 9999;
        display: flex; justify-content: center; align-items: center;
        animation: fadeIn 0.3s ease-out;
        cursor: grab; /* Shows user they can drag anywhere */
    }
    .fullscreen-overlay:active { cursor: grabbing; }

    .overlay-content {
        width: 100%;
        display: flex; flex-direction: column; align-items: center;
        pointer-events: none; /* Let clicks pass through to window listener */
    }
    /* Re-enable pointer events for buttons/scroll */
    .overlay-content > * { pointer-events: auto; }

    .edit-readout { margin-bottom: 40px; color: white; line-height: 1; }
    .edit-readout .val { font-size: 8rem; font-weight: 800; }
    .edit-readout .lbl { font-size: 2rem; font-weight: 500; opacity: 0.8; margin-left: 10px; }

    /* --- RULER STYLES --- */
    .ruler-container {
        position: relative; width: 100%; height: 160px;
        mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent);
        -webkit-mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent);
    }

    .center-line {
        position: absolute; left: 50%; bottom: 0;
        width: 4px; height: 70px;
        background: #ff7675; border-radius: 2px;
        transform: translateX(-50%);
        z-index: 10; pointer-events: none;
        box-shadow: 0 0 15px #ff7675;
    }

    .scroll-track {
        display: flex; align-items: flex-end;
        overflow-x: auto; height: 100%; width: 100%;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
    }
    .scroll-track::-webkit-scrollbar { display: none; }

    .tick-group {
        flex-shrink: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
        height: 100%; position: relative;
        scroll-snap-align: center; 
    }

    .tick { background: rgba(255,255,255,0.4); border-radius: 2px; }
    .tick.major { width: 4px; height: 50px; background: white; margin-bottom: 10px; }
    .tick.minor { width: 2px; height: 20px; margin-bottom: 10px; opacity: 0.5; }

    .tick-label {
        position: absolute; top: 30px;
        font-size: 1.1rem; font-weight: 700; color: white;
    }

    .save-btn {
        margin-top: 50px;
        background: white; color: #ba4949;
        border: none; padding: 15px 50px; border-radius: 50px;
        font-weight: 800; font-size: 1.2rem; cursor: pointer;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        transition: transform 0.1s;
    }
    .save-btn:hover { transform: scale(1.05); }

    /* --- STANDARD UI --- */
    .task-pill { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-bottom: 20px; display: inline-flex; align-items: center; gap: 8px; }
    .active-dot { color: #4caf50; font-size: 0.8rem; }
    .inactive { opacity: 0.6; font-style: italic; }
    .timer-digits { font-size: 7rem; margin: 10px 0 30px 0; font-weight: 700; user-select: none; color: white; line-height: 1; cursor: pointer; transition: transform 0.1s; }
    .timer-digits:hover { transform: scale(1.02); }
    .controls { display: flex; gap: 15px; margin-bottom: 40px; }
    .btn-main { background: white; color: #ba4949; border: none; padding: 15px 40px; font-size: 1.2rem; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 0 #e0e0e0; transition: transform 0.1s; }
    .btn-main:active { transform: translateY(4px); box-shadow: none; }
    .btn-sec { background: rgba(255,255,255,0.2); color: white; border: none; padding: 15px 30px; font-size: 1rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-sec:hover { background: rgba(255,255,255,0.3); }
    .modes { display: flex; gap: 10px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 12px; }
    .modes button { background: transparent; border: none; color: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .modes button:hover { color: white; }
    .modes button.active { background: rgba(255,255,255,0.2); color: white; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>