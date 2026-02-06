<script>
    import { timer } from '$lib/stores/timer';
    import { tasks, heroTask } from '$lib/stores/tasks';
    import { settings } from '$lib/stores/settings';
    import { history } from '$lib/stores/history';
    import { fly } from 'svelte/transition';

    import { send, receive, growWithGradient } from '$lib/components/ui/transitions.js';
    import { handleTimerCompletion, advancePhase, applyMode } from '$lib/components/timer/TimerLogic';

    import TimerCompleteModal from '$lib/components/TimerCompleteModal.svelte';
    import TimeEditor from '$lib/components/timer/TimeEditor.svelte';

    // --- DISPLAY LOGIC ---
    $: minutes = Math.floor($timer.timeLeft / 60);
    $: seconds = $timer.timeLeft % 60;
    $: displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    $: activeTask = $heroTask;

    const isToday = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    };
    $: completedToday = $history ? $history.filter(h => isToday(h.date)).length : 0;

    // --- TIMER COMPLETION LOGIC ---
    let previousTime = -1;
    let processingCompletion = false; 
    let showCompleteModal = false;

    $: {
        if (previousTime > 0 && $timer.timeLeft === 0 && !processingCompletion) {
             onTimerComplete();
        }
        previousTime = $timer.timeLeft;
    }

    async function onTimerComplete() {
        processingCompletion = true;
        const result = await handleTimerCompletion($heroTask, completedToday);
        if (result.shouldShowModal) {
            showCompleteModal = true;
        } else {
            setTimeout(() => { processingCompletion = false; }, 100);
        }
    }

    async function takeBreak() {
        showCompleteModal = false;
        await advancePhase(completedToday);
        setTimeout(() => { processingCompletion = false; }, 100);
    }

    async function skipBreak() {
        showCompleteModal = false;
        applyMode('pomodoro');
        setTimeout(() => { processingCompletion = false; }, 100);
    }

    // --- EDITING LOGIC ---
    let isEditing = false;
    let editStartMinutes = 25;

    function startEditing() {
        if ($timer.isRunning) return; 
        // Calculate where the ruler should start (current timer duration in mins)
        editStartMinutes = Math.floor($timer.timeLeft / 60) || 1;
        isEditing = true;
    }

    // --- HOLD TO QUIT LOGIC ---
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

<div class="glass-panel" class:dimmed={$timer.isRunning || isEditing || showCompleteModal} in:fly={{ y: 20, duration: 400 }}>
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
    {:else}
         <div style="height: 7rem; margin: 10px 0 30px 0;"></div>
    {/if}

    <div class="controls" class:hidden={$timer.isRunning}>
        <button class="btn-main" on:click={timer.start}>START</button>
    </div>

    <div class="modes" class:hidden={$timer.isRunning}>
        <button on:click={() => applyMode('pomodoro')} class:active={$timer.mode === 'pomodoro'}>Pomodoro</button>
        <button on:click={() => applyMode('short')} class:active={$timer.mode === 'short'}>Short Break</button>
        <button on:click={() => applyMode('long')} class:active={$timer.mode === 'long'}>Long Break</button>
    </div>

    <div class="cycle-info">
        Session { (completedToday % ($settings?.longBreakInterval || 4)) + 1 } of { $settings?.longBreakInterval || 4 }
    </div>
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
    <TimeEditor 
        initialMinutes={editStartMinutes} 
        on:close={() => isEditing = false} 
    />
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
        transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        opacity: 1 !important; 
    }
    
    .glass-panel.dimmed { 
        pointer-events: none; 
        transform: scale(0.98);
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
    
    .task-pill { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-bottom: 20px; display: inline-flex; align-items: center; gap: 8px; }
    .active-dot { color: #4caf50; font-size: 0.8rem; }
    .inactive { opacity: 0.6; font-style: italic; }
    
    .controls { display: flex; gap: 15px; margin-bottom: 40px; }
    
    .btn-main { background: white; color: #ba4949; border: none; padding: 15px 40px; font-size: 1.2rem; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 0 #e0e0e0; transition: transform 0.1s; }
    
    .modes { display: flex; gap: 10px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 12px; }
    .modes button { background: transparent; border: none; color: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .modes button.active { background: rgba(255,255,255,0.2); color: white; }
    .cycle-info { margin-top: 20px; font-size: 0.85rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }

    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    .shaking .big-time { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; color: #ff4757; }
    @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
</style>