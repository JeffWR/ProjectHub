<script>
    import { timer } from '$lib/stores/timer';
    import { tasks, heroTask } from '$lib/stores/tasks';
    import { settings } from '$lib/stores/settings';
    import { history, logSession } from '$lib/stores/history';
    import { tick } from 'svelte';
    
    // --- DISPLAY LOGIC ---
    $: minutes = Math.floor($timer.timeLeft / 60);
    $: seconds = $timer.timeLeft % 60;
    $: displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    $: activeTask = $heroTask;

    // --- TIMELINE CONFIG ---
    let isEditing = false;
    let scrollContainer;
    
    // Sync currentMinutes for the ruler (Fallback to 25 if settings missing)
    let currentMinutes = $settings?.pomodoro || 25;
    
    const TICK_WIDTH = 50; 
    const MAX_TIME = 120;  

    // --- AUTO-CYCLE LOGIC ---
    const isToday = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    };
    
    $: completedToday = $history ? $history.filter(h => isToday(h.date)).length : 0;

    // --- THE SIMPLIFIED COMPLETION LOGIC ---
    let previousTime = -1;
    let processingCompletion = false; // Safety Lock

    $: {
        // 1. Check if we just hit 0 from a positive number
        if (previousTime > 0 && $timer.timeLeft === 0 && !processingCompletion) {
            handleTimerDone();
        }
        // 2. Always update previousTime for the next check
        previousTime = $timer.timeLeft;
    }

    function handleTimerDone() {
        // Lock the function so it doesn't fire twice
        processingCompletion = true;

        // 1. Log the work immediately
        if ($timer.mode === 'pomodoro') {
            logSession($settings?.pomodoro || 25, $heroTask?.id, $heroTask?.title || 'Focus');
        }

        // 2. WAIT before switching modes. 
        // This prevents the "Infinite Loop" crash by letting the UI render "0:00" first.
        setTimeout(() => {
            nextPhase();
            processingCompletion = false; // Unlock
        }, 500); // 0.5 second delay (feels natural)
    }

    async function nextPhase() {
        // Logic: What comes next?
        if ($timer.mode === 'pomodoro') {
            // We just finished work. Time for a break.
            const sessionsDone = completedToday + 1;
            const interval = $settings?.longBreakInterval || 4;
            
            if (sessionsDone % interval === 0) {
                applyMode('long');
            } else {
                applyMode('short');
            }
        } else {
            // We just finished a break. Back to work.
            applyMode('pomodoro');
        }

        // Auto-start if enabled
        if ($settings?.autoStart) {
            await tick(); // Wait for the DOM to update
            timer.start();
        }
    }

    // Helper to safely apply mode and duration
    function applyMode(mode) {
        // 1. Update the Store Mode
        timer.setMode(mode);
        
        // 2. Get the correct minutes from settings
        let duration = 25;
        if (mode === 'pomodoro') duration = $settings?.pomodoro || 25;
        if (mode === 'short') duration = $settings?.shortBreak || 5;
        if (mode === 'long') duration = $settings?.longBreak || 15;
        
        // 3. Update the Store Time
        timer.setDuration(duration);
        
        // 4. Update the local ruler variable
        currentMinutes = duration;
    }

    // --- EDIT MODE START ---
    async function startEditing() {
        if ($timer.isRunning) return; 
        isEditing = true;
        currentMinutes = Math.floor($timer.timeLeft / 60) || 1;
        
        await tick();
        if (scrollContainer) {
            const targetScroll = (currentMinutes - 1) * TICK_WIDTH;
            scrollContainer.scrollLeft = targetScroll;
        }
    }

    // --- SCROLL HANDLER ---
    function handleScroll() {
        if (!scrollContainer) return;
        let rawValue = Math.round(scrollContainer.scrollLeft / TICK_WIDTH) + 1;
        currentMinutes = Math.max(1, Math.min(MAX_TIME, rawValue));
    }

    // --- DRAG PHYSICS ---
    let isDragging = false;
    let startX, startScrollLeft;

    function onMouseDown(e) {
        if (!isEditing) return;
        if (e.target.closest('button')) return;
        isDragging = true;
        startX = e.pageX;
        if (scrollContainer) {
            startScrollLeft = scrollContainer.scrollLeft;
            scrollContainer.style.scrollSnapType = 'none'; 
        }
        document.body.style.cursor = 'grabbing';
    }

    function onMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        if (scrollContainer) scrollContainer.style.scrollSnapType = 'x mandatory';
        document.body.style.cursor = 'default';
    }

    function onMouseMove(e) {
        if (!isDragging || !scrollContainer) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = (x - startX) * 1.5; 
        scrollContainer.scrollLeft = startScrollLeft - walk;
    }

    // --- SAVE EDIT ---
    function saveEdit() {
        timer.setDuration(currentMinutes);
        // Also update the global settings for this mode
        settings.update(s => {
            const newS = { ...s };
            if ($timer.mode === 'pomodoro') newS.pomodoro = currentMinutes;
            if ($timer.mode === 'short') newS.shortBreak = currentMinutes;
            if ($timer.mode === 'long') newS.longBreak = currentMinutes;
            return newS;
        });
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

    <h1 class="timer-digits" on:click={startEditing} title="Click to edit">
        {displayTime}
    </h1>

    <div class="controls">
        <button class="btn-main" on:click={$timer.isRunning ? timer.pause : timer.start}>
            {$timer.isRunning ? 'PAUSE' : 'START'}
        </button>
        <button class="btn-sec" on:click={timer.reset}>RESET</button>
    </div>

    <div class="modes">
        <button on:click={() => applyMode('pomodoro')} class:active={$timer.mode === 'pomodoro'}>Pomodoro</button>
        <button on:click={() => applyMode('short')} class:active={$timer.mode === 'short'}>Short Break</button>
        <button on:click={() => applyMode('long')} class:active={$timer.mode === 'long'}>Long Break</button>
    </div>

    {#if $timer.mode === 'pomodoro'}
        <div class="cycle-info">
            Session { (completedToday % ($settings?.longBreakInterval || 4)) + 1 } of { $settings?.longBreakInterval || 4 }
        </div>
    {/if}
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
    /* ... YOUR EXISTING CSS (UNCHANGED) ... */
    
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
    .glass-panel.hidden { opacity: 0; pointer-events: none; transform: scale(0.95); }

    .fullscreen-overlay {
        position: fixed; inset: 0;
        background: rgba(15, 15, 15, 0.9);
        backdrop-filter: blur(20px);
        z-index: 9999;
        display: flex; justify-content: center; align-items: center;
        animation: fadeIn 0.3s ease-out;
        cursor: grab;
    }
    .fullscreen-overlay:active { cursor: grabbing; }

    .overlay-content { width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
    .overlay-content > * { pointer-events: auto; }

    .edit-readout { margin-bottom: 40px; color: white; line-height: 1; }
    .edit-readout .val { font-size: 8rem; font-weight: 800; }
    .edit-readout .lbl { font-size: 2rem; font-weight: 500; opacity: 0.8; margin-left: 10px; }

    .ruler-container {
        position: relative; width: 100%; height: 160px;
        mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent);
        -webkit-mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent);
    }
    .center-line {
        position: absolute; left: 50%; bottom: 0; width: 4px; height: 70px;
        background: #ff7675; border-radius: 2px; transform: translateX(-50%);
        z-index: 10; pointer-events: none; box-shadow: 0 0 15px #ff7675;
    }
    .scroll-track {
        display: flex; align-items: flex-end; overflow-x: auto; height: 100%; width: 100%;
        scroll-snap-type: x mandatory; scrollbar-width: none;
    }
    .scroll-track::-webkit-scrollbar { display: none; }
    
    .tick-group {
        flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
        height: 100%; position: relative; scroll-snap-align: center; 
    }
    .tick { background: rgba(255,255,255,0.4); border-radius: 2px; }
    .tick.major { width: 4px; height: 50px; background: white; margin-bottom: 10px; }
    .tick.minor { width: 2px; height: 20px; margin-bottom: 10px; opacity: 0.5; }
    .tick-label { position: absolute; top: 30px; font-size: 1.1rem; font-weight: 700; color: white; }

    .save-btn {
        margin-top: 50px; background: white; color: #ba4949; border: none; padding: 15px 50px; border-radius: 50px;
        font-weight: 800; font-size: 1.2rem; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: transform 0.1s;
    }
    .save-btn:hover { transform: scale(1.05); }

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
    .cycle-info { margin-top: 20px; font-size: 0.85rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>