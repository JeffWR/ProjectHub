<script>
    import { timer } from '$lib/stores/timer';
    import { tasks, activeTaskId } from '$lib/stores/tasks';
    
    // Format Seconds to MM:SS
    $: minutes = Math.floor($timer.timeLeft / 60);
    $: seconds = $timer.timeLeft % 60;
    $: displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Get Active Task Name
    $: activeTask = $tasks.find(t => t.id === $activeTaskId);
</script>

<div class="glass-panel">
    <div class="task-pill">
        {activeTask ? `Working on: ${activeTask.title}` : 'Select a task from Tasks tab'}
    </div>

    <h1 class="timer-digits" on:dblclick={() => alert('Open Settings Modal Here')}>
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
    }
    
    .timer-digits { font-size: 7rem; margin: 20px 0; font-weight: 700; user-select: none; }
    
    .btn-main {
        background: white; color: #ba4949; border: none; padding: 15px 40px; 
        font-size: 1.2rem; border-radius: 12px; font-weight: bold; cursor: pointer;
        box-shadow: 0 5px 0 #ddd; transition: transform 0.1s;
    }
    .btn-main:active { transform: translateY(5px); box-shadow: none; }
    
    .btn-sec { background: transparent; border: 2px solid white; color: white; padding: 15px 30px; border-radius: 12px; font-weight: bold; cursor: pointer; }

    .modes { margin-top: 30px; display: flex; gap: 10px; justify-content: center; }
    .modes button { background: none; border: none; color: white; opacity: 0.7; cursor: pointer; font-size: 0.9rem; }
    .modes button.active { opacity: 1; font-weight: bold; text-decoration: underline; }
</style>