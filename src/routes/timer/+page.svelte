<script>
    import { timer } from '$lib/stores/timer';
    // CRITICAL FIX: Import 'heroTask' instead of 'activeTaskId'
    import { tasks, heroTask } from '$lib/stores/tasks';
    
    // Format Seconds to MM:SS
    $: minutes = Math.floor($timer.timeLeft / 60);
    $: seconds = $timer.timeLeft % 60;
    $: displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // NEW LOGIC: Just listen to the heroTask directly
    $: activeTask = $heroTask;
</script>

<div class="glass-panel">
    <div class="task-pill">
        {#if activeTask}
            <span class="active-dot">●</span> Working on: <strong>{activeTask.title}</strong>
        {:else}
            <span class="inactive">Drag a task to "In Focus" to start</span>
        {/if}
    </div>

    <h1 class="timer-digits">
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

<style>
    .glass-panel {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        padding: 50px 80px;
        border-radius: 30px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex; flex-direction: column; align-items: center;
    }
    
    .task-pill {
        background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px;
        font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-bottom: 20px;
        display: inline-flex; align-items: center; gap: 8px;
    }
    .active-dot { color: #4caf50; font-size: 0.8rem; }
    .inactive { opacity: 0.6; font-style: italic; }

    .timer-digits { font-size: 7rem; margin: 10px 0 30px 0; font-weight: 700; user-select: none; color: white; line-height: 1; }
    
    .controls { display: flex; gap: 15px; margin-bottom: 40px; }

    .btn-main {
        background: white; color: #ba4949; border: none; padding: 15px 40px; 
        font-size: 1.2rem; border-radius: 12px; font-weight: 800; cursor: pointer;
        box-shadow: 0 4px 0 #e0e0e0; transition: transform 0.1s, box-shadow 0.1s;
    }
    .btn-main:active { transform: translateY(4px); box-shadow: none; }

    .btn-sec {
        background: rgba(255,255,255,0.2); color: white; border: none; padding: 15px 30px;
        font-size: 1rem; border-radius: 12px; font-weight: 600; cursor: pointer;
        transition: 0.2s;
    }
    .btn-sec:hover { background: rgba(255,255,255,0.3); }

    .modes { display: flex; gap: 10px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 12px; }
    .modes button {
        background: transparent; border: none; color: rgba(255,255,255,0.6);
        padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    .modes button:hover { color: white; }
    .modes button.active { background: rgba(255,255,255,0.2); color: white; }
</style>