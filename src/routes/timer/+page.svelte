<script>
    import { timer } from '$lib/stores/timer';
    import { tasks, heroTask } from '$lib/stores/tasks';
    import { settings } from '$lib/stores/settings';
    import { history, logSession } from '$lib/stores/history';
    import { tick } from 'svelte';
    import { fade, fly, crossfade } from 'svelte/transition';
    import { cubicOut, quintOut } from 'svelte/easing';

    import TimerCompleteModal from '$lib/components/TimerCompleteModal.svelte';

    // --- 1. CROSSFADE (Timer Digits Movement) ---
    const [send, receive] = crossfade({
        duration: 1000, 
        easing: quintOut,
        fallback: scale
    });

    function scale(node, { duration }) {
        return {
            duration,
            css: t => `transform: scale(${t}); opacity: ${t}`
        };
    }

    // --- 2. SOFT GRADIENT EXPANSION ---
    // We animate from 0 to 4. 
    // IMPORTANT: The CSS must also be set to scale(4) so it stays there when done.
    function growWithGradient(node, { duration }) {
        return {
            duration,
            css: t => {
                const eased = cubicOut(t);
                return `transform: scale(${eased * 4}); opacity: ${eased};`;
            }
        };
    }

    // --- DISPLAY LOGIC ---
    $: minutes = Math.floor($timer.timeLeft / 60);
    $: seconds = $timer.timeLeft % 60;
    $: displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    $: activeTask = $heroTask;

    // --- TIMELINE CONFIG ---
    let isEditing = false;
    let scrollContainer;
    let currentMinutes = $settings?.pomodoro || 25;
    const TICK_WIDTH = 50; 
    const MAX_TIME = 120;  

    // --- LOGIC: DATE / COMPLETION ---
    const isToday = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    };
    $: completedToday = $history ? $history.filter(h => isToday(h.date)).length : 0;

    // --- LOGIC: TIMER COMPLETION ---
    let previousTime = -1;
    let processingCompletion = false; 
    let showCompleteModal = false;

    $: {
        if (previousTime > 0 && $timer.timeLeft === 0 && !processingCompletion) handleTimerDone();
        previousTime = $timer.timeLeft;
    }

    function handleTimerDone() {
        processingCompletion = true;
        if ($timer.mode === 'pomodoro') {
            logSession($settings?.pomodoro || 25, $heroTask?.id, $heroTask?.title || 'Focus');
            showCompleteModal = true;
        } else {
            nextPhase(); 
        }
    }

    async function takeBreak() {
        showCompleteModal = false;
        nextPhase();
        setTimeout(() => { processingCompletion = false; }, 100);
    }

    async function skipBreak() {
        showCompleteModal = false;
        applyMode('pomodoro');
        setTimeout(() => { processingCompletion = false; }, 100);
    }

    async function nextPhase() {
        if ($timer.mode === 'pomodoro') {
            const sessionsDone = completedToday; 
            const interval = $settings?.longBreakInterval || 4;
            if (sessionsDone % interval === 0) applyMode('long');
            else applyMode('short');
        } else {
            applyMode('pomodoro');
            setTimeout(() => { processingCompletion = false; }, 100);
        }
        if ($settings?.autoStart) {
            await tick();
            timer.start();
        }
    }

    function applyMode(mode) {
        timer.setMode(mode);
        let duration = 25;
        if (mode === 'pomodoro') duration = $settings?.pomodoro || 25;
        if (mode === 'short') duration = $settings?.shortBreak || 5;
        if (mode === 'long') duration = $settings?.longBreak || 15;
        timer.setDuration(duration);
        currentMinutes = duration;
    }

    // --- LOGIC: EDITING ---
    async function startEditing() {
        if ($timer.isRunning) return; 
        isEditing = true;
        currentMinutes = Math.floor($timer.timeLeft / 60) || 1;
        await tick();
        if (scrollContainer) scrollContainer.scrollLeft = (currentMinutes - 1) * TICK_WIDTH;
    }

    function handleScroll() {
        if (!scrollContainer) return;
        let rawValue = Math.round(scrollContainer.scrollLeft / TICK_WIDTH) + 1;
        currentMinutes = Math.max(1, Math.min(MAX_TIME, rawValue));
    }

    function saveEdit() {
        timer.setDuration(currentMinutes);
        settings.update(s => {
            const newS = { ...s };
            if ($timer.mode === 'pomodoro') newS.pomodoro = currentMinutes;
            if ($timer.mode === 'short') newS.shortBreak = currentMinutes;
            if ($timer.mode === 'long') newS.longBreak = currentMinutes;
            return newS;
        });
        isEditing = false;
    }

    let isDragging = false;
    let startX, startScrollLeft;
    function onMouseDown(e) { if (!isEditing || e.target.closest('button')) return; isDragging = true; startX = e.pageX; if (scrollContainer) { startScrollLeft = scrollContainer.scrollLeft; scrollContainer.style.scrollSnapType = 'none'; } document.body.style.cursor = 'grabbing'; }
    function onMouseUp() { if (!isDragging) return; isDragging = false; if (scrollContainer) scrollContainer.style.scrollSnapType = 'x mandatory'; document.body.style.cursor = 'default'; }
    function onMouseMove(e) { if (!isDragging || !scrollContainer) return; e.preventDefault(); const x = e.pageX; const walk = (x - startX) * 1.5; scrollContainer.scrollLeft = startScrollLeft - walk; }

    // --- LOGIC: HOLD TO QUIT ---
    let isHolding = false;
    let holdProgress = 0;
    let holdFrame;
    let holdStartTime;
    const HOLD_DURATION = 2000; 
    const RADIUS = 220; 
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS; 
    $: strokeDashoffset = CIRCUMFERENCE - (holdProgress / 100) * CIRCUMFERENCE;

    function startHold() {
        if (!$timer.isRunning) return;
        isHolding = true;
        holdStartTime = Date.now();
        function loop() {
            if (!isHolding) return;
            const elapsed = Date.now() - holdStartTime;
            holdProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
            if (elapsed >= HOLD_DURATION) {
                timer.reset();
                cancelHold();
            } else {
                holdFrame = requestAnimationFrame(loop);
            }
        }
        holdFrame = requestAnimationFrame(loop);
    }
    function cancelHold() {
        isHolding = false;
        holdProgress = 0;
        if (holdFrame) cancelAnimationFrame(holdFrame);
    }
</script>

<svelte:window on:mousedown={onMouseDown} on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div class="glass-panel" class:dimmed={$timer.isRunning || isEditing || showCompleteModal}>
    <div class="task-pill">
        {#if activeTask}
            <span class="active-dot">●</span> Working on: <strong>{activeTask.title}</strong>
        {:else}
            <span class="inactive">Drag a task to "In Focus" to start</span>
        {/if}
    </div>

    {#if !$timer.isRunning && !isEditing}
        <h1 
            class="timer-digits dashboard-timer" 
            on:click={startEditing} 
            in:receive={{ key: 'timer-move' }} 
            out:send={{ key: 'timer-move' }}
            title="Click to edit"
        >
            {displayTime}
        </h1>
    {:else if !$timer.isRunning && isEditing}
         <div style="height: 7rem; margin: 10px 0 30px 0;"></div>
    {:else}
         <div style="height: 7rem; margin: 10px 0 30px 0;"></div>
    {/if}

    <div class="controls" class:hidden={$timer.isRunning}>
        <button class="btn-main" on:click={timer.start}>START</button>
        <button class="btn-sec" on:click={timer.reset}>RESET</button>
    </div>

    <div class="modes" class:hidden={$timer.isRunning}>
        <button on:click={() => applyMode('pomodoro')} class:active={$timer.mode === 'pomodoro'}>Pomodoro</button>
        <button on:click={() => applyMode('short')} class:active={$timer.mode === 'short'}>Short Break</button>
        <button on:click={() => applyMode('long')} class:active={$timer.mode === 'long'}>Long Break</button>
    </div>

    {#if $timer.mode === 'pomodoro' && !$timer.isRunning}
        <div class="cycle-info">
            Session { (completedToday % ($settings?.longBreakInterval || 4)) + 1 } of { $settings?.longBreakInterval || 4 }
        </div>
    {/if}
</div>

{#if $timer.isRunning}
    <div 
        class="focus-overlay-container"
        on:mousedown={startHold} 
        on:mouseup={cancelHold} 
        on:mouseleave={cancelHold}
        on:touchstart|preventDefault={startHold}
        on:touchend={cancelHold}
        on:contextmenu|preventDefault
    >
        <div class="focus-background" transition:growWithGradient={{ duration: 1200 }}></div>

        <div class="focus-content">
            <div class="focus-task" in:fly={{ y: -20, duration: 1200, delay: 300 }}>
                {#if activeTask}
                    {activeTask.title}
                {:else}
                    Focus Mode
                {/if}
            </div>

            <div class="timer-wrapper" class:shaking={isHolding && holdProgress > 85}>
                <svg class="progress-ring" width="500" height="500" style="opacity: {isHolding ? 1 : 0}">
                    <circle 
                        stroke="#ff4757" stroke-width="4" fill="transparent"
                        r={RADIUS} cx="250" cy="250"
                        stroke-dasharray={CIRCUMFERENCE}
                        stroke-dashoffset={strokeDashoffset}
                        class="progress-ring__circle"
                    />
                </svg>
                
                <div 
                    class="big-time" 
                    in:receive={{ key: 'timer-move' }} 
                    out:send={{ key: 'timer-move' }}
                >
                    {displayTime}
                </div>
            </div>

            <div class="instruction">
                {#if isHolding}
                    <span class="text-danger">Keep holding to stop...</span>
                {:else}
                    <span class="text-muted">Hold to Stop</span>
                {/if}
            </div>
        </div>
    </div>
{/if}

{#if isEditing}
    <div class="fullscreen-overlay" transition:fade={{ duration: 200 }}>
        <div class="overlay-content">
            <div class="edit-readout">
                <span class="val">{currentMinutes}</span><span class="lbl">min</span>
            </div>
            <div class="ruler-container">
                <div class="center-line"></div>
                <div class="scroll-track" bind:this={scrollContainer} on:scroll={handleScroll}>
                    <div class="spacer" style="flex: 0 0 calc(50% - {TICK_WIDTH / 2}px);"></div>
                    {#each Array(MAX_TIME) as _, i}
                        <div class="tick-group" style="width: {TICK_WIDTH}px">
                            {#if (i + 1) % 5 === 0}
                                <div class="tick major"></div><span class="tick-label">{i + 1}</span>
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

{#if showCompleteModal}
    <TimerCompleteModal on:takeBreak={takeBreak} on:skipBreak={skipBreak} />
{/if}

<style>
    /* --- GLASS PANEL (DASHBOARD) --- */
    .glass-panel {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 30px;
        width: 100%; max-width: 600px;
        aspect-ratio: 4/3;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        text-align: center;
        transition: opacity 0.8s ease, filter 0.8s ease;
    }
    
    .glass-panel.dimmed { 
        opacity: 0; 
        filter: blur(10px); 
        pointer-events: none; 
    }

    /* --- FOCUS MODE BACKGROUND --- */
    .focus-overlay-container {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        z-index: 9999;
        display: flex; justify-content: center; align-items: center;
        cursor: pointer;
    }
    
    .focus-background {
        position: absolute; 
        top: 50%; left: 50%;
        width: 100vmin; height: 100vmin; 
        margin-left: -50vmin; margin-top: -50vmin;
        border-radius: 50%;
        background: radial-gradient(closest-side, #000 0%, #050505 50%, transparent 100%);
        z-index: 9998;

        /* IMPORTANT FIX: 
           This ensures that when the animation ends, the element 
           STAYS at 4x scale (covering the screen) instead of 
           snapping back to small size. */
        transform: scale(4); 
    }

    /* --- TYPOGRAPHY --- */
    .timer-digits {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-weight: 700;
        color: white;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        font-feature-settings: "tnum";
        user-select: none;
        letter-spacing: -2px;
    }
    .dashboard-timer { font-size: 7rem; margin: 10px 0 30px 0; cursor: pointer; }
    .dashboard-timer:hover { transform: scale(1.02); }

    .big-time {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-weight: 800;
        font-size: 9rem;
        color: white;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        font-feature-settings: "tnum";
        letter-spacing: -3px;
        pointer-events: none;
        z-index: 10001;
    }

    .focus-content {
        position: relative; z-index: 10000;
        display: flex; flex-direction: column; align-items: center; gap: 40px;
        transform: translateY(-20px);
    }
    .focus-task { font-size: 1.5rem; color: rgba(255,255,255,0.6); font-weight: 500; letter-spacing: 0.5px; }
    .timer-wrapper { position: relative; width: 500px; height: 500px; display: flex; align-items: center; justify-content: center; }
    .progress-ring { position: absolute; top: 0; left: 0; transform: rotate(-90deg); pointer-events: none; transition: opacity 0.3s ease; }
    .progress-ring__circle { transition: stroke-dashoffset 0.05s linear; stroke-linecap: round; }
    .instruction { height: 24px; font-size: 0.8rem; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; pointer-events: none; margin-top: -30px; opacity: 0.5; color: white;}
    .text-danger { color: #ff4757; animation: pulse 1s infinite; opacity: 1; }

    /* --- UTILS --- */
    .hidden { display: none; }
    
    /* Edit Overlay & Controls */
    .fullscreen-overlay { position: fixed; inset: 0; background: rgba(15, 15, 15, 0.9); backdrop-filter: blur(20px); z-index: 9999; display: flex; justify-content: center; align-items: center; }
    .overlay-content { width: 100%; display: flex; flex-direction: column; align-items: center; }
    .edit-readout { margin-bottom: 40px; color: white; line-height: 1; }
    .edit-readout .val { font-size: 8rem; font-weight: 800; }
    .edit-readout .lbl { font-size: 2rem; font-weight: 500; opacity: 0.8; margin-left: 10px; }
    .ruler-container { position: relative; width: 100%; height: 160px; mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent); }
    .center-line { position: absolute; left: 50%; bottom: 0; width: 4px; height: 70px; background: #ff7675; border-radius: 2px; transform: translateX(-50%); z-index: 10; pointer-events: none; box-shadow: 0 0 15px #ff7675; }
    .scroll-track { display: flex; align-items: flex-end; overflow-x: auto; height: 100%; width: 100%; scroll-snap-type: x mandatory; scrollbar-width: none; }
    .scroll-track::-webkit-scrollbar { display: none; }
    .tick-group { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; scroll-snap-align: center; }
    .tick { background: rgba(255,255,255,0.4); border-radius: 2px; }
    .tick.major { width: 4px; height: 50px; background: white; margin-bottom: 10px; }
    .tick.minor { width: 2px; height: 20px; margin-bottom: 10px; opacity: 0.5; }
    .tick-label { position: absolute; top: 30px; font-size: 1.1rem; font-weight: 700; color: white; }
    .save-btn { margin-top: 50px; background: white; color: #ba4949; border: none; padding: 15px 50px; border-radius: 50px; font-weight: 800; font-size: 1.2rem; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: transform 0.1s; }
    .task-pill { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-bottom: 20px; display: inline-flex; align-items: center; gap: 8px; }
    .active-dot { color: #4caf50; font-size: 0.8rem; }
    .inactive { opacity: 0.6; font-style: italic; }
    .controls { display: flex; gap: 15px; margin-bottom: 40px; }
    .btn-main { background: white; color: #ba4949; border: none; padding: 15px 40px; font-size: 1.2rem; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 0 #e0e0e0; transition: transform 0.1s; }
    .btn-sec { background: rgba(255,255,255,0.2); color: white; border: none; padding: 15px 30px; font-size: 1rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .modes { display: flex; gap: 10px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 12px; }
    .modes button { background: transparent; border: none; color: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .modes button.active { background: rgba(255,255,255,0.2); color: white; }
    .cycle-info { margin-top: 20px; font-size: 0.85rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }

    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    .shaking .big-time { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; color: #ff4757; }
    @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
</style>