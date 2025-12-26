<script>
    import { moveTask, deleteTask, activeTaskId } from '$lib/stores/tasks';
    import { ArrowRight, ArrowLeft, Trash2, Play, Clock } from 'lucide-svelte';
    
    export let task;
    export let showProgress = false; // Only true for "In Progress" column

    $: isSelected = $activeTaskId === task.id;
    
    // Calculate Progress %
    $: progressPct = Math.min(100, (task.timeSpent / task.estTime) * 100);

    // Color Helpers
    const pColors = { Low: '#4caf50', Medium: '#ff9800', High: '#f44336' };
    $: pColor = pColors[task.priority] || '#999';
</script>

<div class="task-card" class:active-card={isSelected} style="--accent: {pColor}">
    
    <div class="card-top">
        <span class="priority" style="background: {pColor}20; color: {pColor}">
            {task.priority}
        </span>
        <button class="delete-btn" on:click={() => deleteTask(task.id)}><Trash2 size={14} /></button>
    </div>

    <div class="card-body">
        <h4>{task.title}</h4>
        {#if task.description}<p class="desc">{task.description}</p>{/if}
        
        <div class="meta">
            <span class="est"><Clock size={12}/> {task.estTime}m</span>
        </div>
    </div>

    {#if showProgress}
        <div class="progress-container">
            <div class="progress-bar" style="width: {progressPct}%"></div>
            <span class="progress-text">{task.timeSpent}m / {task.estTime}m</span>
        </div>
    {/if}

    <div class="card-actions">
        {#if task.status === 'todo'}
            <div class="spacer"></div>
            <button class="action-btn start" on:click={() => moveTask(task.id, 'inprogress')}>
                Start <Play size={14} />
            </button>
        {:else if task.status === 'inprogress'}
            <button class="action-btn sec" on:click={() => moveTask(task.id, 'todo')}>Wait</button>
            <button class="action-btn finish" on:click={() => moveTask(task.id, 'review')}>Done</button>
        {:else}
            <button class="action-btn sec" on:click={() => moveTask(task.id, 'inprogress')}>Fix</button>
        {/if}
    </div>

</div>

<style>
    .task-card {
        background: white; color: #333; padding: 15px; border-radius: 16px;
        margin-bottom: 12px; border-left: 4px solid var(--accent);
        box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: 0.2s;
    }
    .active-card { transform: scale(1.02); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

    .card-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .priority { font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
    
    .card-body h4 { margin: 0 0 4px 0; font-size: 1rem; }
    .desc { margin: 0 0 10px 0; font-size: 0.8rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .meta { display: flex; gap: 10px; font-size: 0.75rem; color: #888; }
    .est { display: flex; align-items: center; gap: 4px; }

    /* Progress Bar Styles */
    .progress-container { margin: 12px 0; position: relative; height: 6px; background: #eee; border-radius: 3px; }
    .progress-bar { height: 100%; background: #ba4949; border-radius: 3px; transition: width 0.5s; }
    .progress-text { position: absolute; right: 0; top: -18px; font-size: 0.7rem; color: #ba4949; font-weight: bold; }

    .card-actions { display: flex; justify-content: space-between; margin-top: 10px; }
    .action-btn { 
        border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600;
        display: flex; align-items: center; gap: 5px;
    }
    .start { background: #ba4949; color: white; }
    .finish { background: #4caf50; color: white; }
    .sec { background: #f0f0f0; color: #666; }
    .delete-btn { background: none; border: none; cursor: pointer; color: #ccc; }
    .delete-btn:hover { color: red; }
    .spacer { flex: 1; }
</style>