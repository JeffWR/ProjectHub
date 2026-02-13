<script>
    import { onMount, onDestroy } from 'svelte';
    import { settings } from '$lib/stores/settings';
    import { heroTask } from '$lib/stores/tasks'; // To get current task title
    import { history, logSession } from '$lib/stores/history'; // To track count
    import { Play, Pause, RotateCcw } from 'lucide-svelte';
    import dingSound from '$lib/assets/ding.mp3'; // Optional sound

    let timeLeft = $settings.pomodoro * 60;
    let isActive = false;
    let mode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak'
    let timerId;

    // Helper: Check if a date string is today
    const isToday = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    // Calculate completed Pomodoros for today from History Store
    $: completedToday = $history.filter(h => isToday(h.date)).length;

    // Update time if settings change while not running
    $: if (!isActive) {
        if (mode === 'pomodoro') timeLeft = $settings.pomodoro * 60;
        else if (mode === 'shortBreak') timeLeft = $settings.shortBreak * 60;
        else if (mode === 'longBreak') timeLeft = $settings.longBreak * 60;
    }

    function toggleTimer() {
        if (isActive) {
            clearInterval(timerId);
            isActive = false;
        } else {
            isActive = true;
            timerId = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                } else {
                    handleTimerComplete();
                }
            }, 1000);
        }
    }

    function handleTimerComplete() {
        clearInterval(timerId);
        isActive = false;
        
        // Play Sound
        // const audio = new Audio(dingSound);
        // audio.play().catch(e => console.log('Audio blocked', e));

        if (mode === 'pomodoro') {
            // 1. Log the session
            logSession($settings.pomodoro, $heroTask?.id || null, $heroTask?.title || 'Focus Session');
            
            // 2. Determine Next Break
            // We use (completedToday + 1) because the store updates async or we just want the 'next' logic
            // Actually, we just logged it, so 'completedToday' will update in next tick. 
            // Let's use the raw count based on logic:
            
            const sessionsDone = completedToday + 1; // +1 includes the one just finished
            const interval = $settings.longBreakInterval || 4;

            if (sessionsDone % interval === 0) {
                switchMode('longBreak');
            } else {
                switchMode('shortBreak');
            }
        } else {
            // If break ended, back to work
            switchMode('pomodoro');
        }
        
        // Optional: Auto-start next timer?
        // if ($settings.autoStart) toggleTimer();
    }

    function switchMode(newMode) {
        mode = newMode;
        if (newMode === 'pomodoro') timeLeft = $settings.pomodoro * 60;
        else if (newMode === 'shortBreak') timeLeft = $settings.shortBreak * 60;
        else if (newMode === 'longBreak') timeLeft = $settings.longBreak * 60;
    }

    function resetTimer() {
        clearInterval(timerId);
        isActive = false;
        if (mode === 'pomodoro') timeLeft = $settings.pomodoro * 60;
        else if (mode === 'shortBreak') timeLeft = $settings.shortBreak * 60;
        else if (mode === 'longBreak') timeLeft = $settings.longBreak * 60;
    }
    
    // Formatting MM:SS
    $: minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    $: seconds = (timeLeft % 60).toString().padStart(2, '0');
    $: progress = 100 - (timeLeft / ($settings[mode] * 60)) * 100;
</script>

<div class="timer-container" class:active-mode={mode !== 'pomodoro'}>
    
    <div class="mode-pills">
        <button class:active={mode === 'pomodoro'} on:click={() => switchMode('pomodoro')}>Pomodoro</button>
        <button class:active={mode === 'shortBreak'} on:click={() => switchMode('shortBreak')}>Short Break</button>
        <button class:active={mode === 'longBreak'} on:click={() => switchMode('longBreak')}>Long Break</button>
    </div>

    <div class="timer-display">
        <div class="time-text">{minutes}:{seconds}</div>
        
        <div class="status-msg">
            {#if mode === 'pomodoro'}
                {#if $heroTask}
                    Focusing on: <span class="task-title">{$heroTask.title}</span>
                {:else}
                    Time to Focus
                {/if}
            {:else}
                Time for a break ☕
            {/if}
        </div>
    </div>

    <div class="controls">
        <button class="toggle-btn" on:click={toggleTimer}>
            {#if isActive} <Pause size={32} fill="white" /> {:else} <Play size={32} fill="white" /> {/if}
        </button>
        <button class="reset-btn" on:click={resetTimer}>
            <RotateCcw size={20} />
        </button>
    </div>

    {#if mode === 'pomodoro'}
        <div class="cycle-indicator">
            Session { (completedToday % ($settings.longBreakInterval || 4)) + 1 } of { $settings.longBreakInterval || 4 }
        </div>
    {/if}
</div>

<style>
    .timer-container {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 40px; background: rgba(255,255,255,0.05); border-radius: 30px;
        border: 1px solid rgba(255,255,255,0.1); transition: 0.3s;
    }
    .active-mode { border-color: #4caf50; background: rgba(76, 175, 80, 0.1); }

    .mode-pills { display: flex; gap: 10px; margin-bottom: 30px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 20px; }
    .mode-pills button { background: none; border: none; color: rgba(255,255,255,0.6); padding: 8px 16px; border-radius: 15px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: 0.2s; }
    .mode-pills button:hover { color: white; }
    .mode-pills button.active { background: rgba(255,255,255,0.1); color: white; font-weight: 700; shadow: 0 2px 5px rgba(0,0,0,0.1); }

    .time-text { font-size: 6rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; margin-bottom: 10px; }
    .status-msg { color: rgba(255,255,255,0.6); margin-bottom: 30px; font-size: 1.1rem; text-align: center; }
    .status-msg span { color: white; font-weight: 600; }
    .task-title { display: inline-block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }

    .controls { display: flex; align-items: center; gap: 20px; }
    .toggle-btn { width: 80px; height: 80px; border-radius: 24px; background: #ba4949; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 20px rgba(186, 73, 73, 0.3); }
    .toggle-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 25px rgba(186, 73, 73, 0.4); }
    .toggle-btn:active { transform: translateY(0); }
    
    .active-mode .toggle-btn { background: #4caf50; box-shadow: 0 10px 20px rgba(76, 175, 80, 0.3); }

    .reset-btn { width: 50px; height: 50px; border-radius: 16px; background: rgba(255,255,255,0.1); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .reset-btn:hover { background: rgba(255,255,255,0.2); transform: rotate(-90deg); }

    .cycle-indicator { margin-top: 25px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.4; }
</style>