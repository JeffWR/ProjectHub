<script>
    import { Trash2, Clock, PlayCircle, Archive } from 'lucide-svelte';
    import { deleteTask, moveTask } from '$lib/stores/tasks';
    
    export let task;
    export let isHero = false; 
    export let showProgress = false;

    // Detect if this card is in the 'Done/Review' column
    $: isReview = task.status === 'review';
    $: isTodo = task.status === 'todo';
    $: isProgress = task.status === 'inprogress';

    // Calculate progress percentage (Only needed if NOT review)
    $: progressPct = task.estTime > 0 ? Math.min(100, (task.timeSpent / task.estTime) * 100) : 0;
    
    // Priority Colors
    const pColors = { Low: '#4caf50', Medium: '#ff9800', High: '#f44336' };
    $: pColor = pColors[task.priority] || '#999';
</script>

<div class="task-card" class:hero={isHero} style="--priority-color: {pColor}">
    
    <div class="card-top">
        <div class="priority-badge" style="color: {pColor}; background: {pColor}15;">
            {task.priority}
        </div>

        {#if isHero}
            <div class="hero-label">
                <PlayCircle size={14} fill="#ba4949" color="white" />
                <span>Timer Active</span>
            </div>
        {/if}

        <button class="delete-btn" on:click|stopPropagation={() => deleteTask(task.id)} title="Delete permanently">
            <Trash2 size={16} />
        </button>
    </div>

    <div class="card-body">
        <h4>{task.title}</h4>
        {#if task.description}
            <p class="desc">{task.description}</p>
        {/if}
        
        <div class="meta-row">
            {#if isReview}
                <span class="meta-item done-time">
                    <Clock size={14}/> {Math.floor(task.timeSpent)}m spent
                </span>
            {:else}
                <span class="meta-item">
                    <Clock size={14}/> {task.estTime}m
                </span>
            {/if}
        </div>
    </div>

    {#if isProgress && (showProgress || task.timeSpent > 0)}
        <div class="progress-section">
            <div class="progress-labels">
                <span>Progress</span>
                <span>{Math.floor(task.timeSpent)}/{task.estTime}m</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: {progressPct}%; background: {isHero ? '#ba4949' : 'var(--priority-color)'}"></div>
            </div>
        </div>
    {/if}

    {#if isReview}
        <button class="finish-btn" on:click|stopPropagation={() => moveTask(task.id, 'archived')}>
            <Archive size={16} />
            <span>Finish Task</span>
        </button>
    {/if}

</div>

<style>
    /* ... Keep your existing Card Styles ... */
    .task-card {
        background: white;
        border-radius: 16px; 
        padding: 18px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
        cursor: grab;
        position: relative;
        border-left: 4px solid var(--priority-color);
        transition: transform 0.1s, box-shadow 0.1s;
    }
    .task-card:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.08); }
    .task-card:active { cursor: grabbing; }

    /* Typography */
    h4 { margin: 0 0 8px 0; font-size: 1.1rem; color: #2d3436; font-weight: 700; }
    .desc { 
        font-size: 0.9rem; 
        color: #636e72; 
        margin: 0 0 15px 0; 
        overflow: hidden; 
        white-space: normal; 
        word-break: break-word;  
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* Header */
    .card-top { display: flex; align-items: center; margin-bottom: 12px; }
    .priority-badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; }
    .hero-label { font-size: 0.7rem; font-weight: 800; color: #ffa502; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; margin-left: auto; margin-right: 15px; animation: pulse 2s infinite; }
    .delete-btn { margin-left: auto; background: transparent; border: none; color: #b2bec3; cursor: pointer; padding: 4px; }
    .delete-btn:hover { color: #d63031; }

    /* Meta */
    .meta-row { display: flex; gap: 15px; margin-bottom: 5px; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #b2bec3; font-weight: 500; }
    
    /* New Style for "Time Spent" in Review */
    .done-time { color: #4caf50; font-weight: 700; }

    /* Progress Bar */
    .progress-section { margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f2f6; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #636e72; margin-bottom: 6px; font-weight: 600; }
    .progress-track { height: 6px; background: #f1f2f6; width: 100%; border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 10px; transition: width 0.3s ease; }

    /* --- NEW FINISH BUTTON --- */
    .finish-btn {
        margin-top: 15px;
        width: 100%;
        padding: 12px;
        background: #2d3436; /* Dark grey for "Archiving" */
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: 0.2s;
    }
    .finish-btn:hover { background: #000; transform: translateY(-2px); }
    .finish-btn:active { transform: translateY(0); }

    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
</style>