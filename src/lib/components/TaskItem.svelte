<script>
    import { deleteTask } from '$lib/stores/tasks';
    import { Trash2, Clock, PlayCircle } from 'lucide-svelte';
    
    export let task;
    export let showProgress = false;
    export let isHero = false; // NEW PROP

    $: progressPct = task.estTime > 0 ? Math.min(100, (task.timeSpent / task.estTime) * 100) : 0;
    const pColors = { Low: '#4caf50', Medium: '#ff9800', High: '#f44336' };
    $: pColor = pColors[task.priority] || '#999';
</script>

<div class="task-card" class:hero={isHero} style="--accent: {pColor}">
    
    <div class="card-top">
        <span class="priority" style="background: {pColor}20; color: {pColor}">
            {task.priority}
        </span>
        {#if isHero}
            <span class="active-badge"><PlayCircle size={12}/> Active</span>
        {/if}
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
            <span class="progress-text">{Math.round(task.timeSpent)}m / {task.estTime}m</span>
        </div>
    {/if}
</div>

<style>
    .task-card {
        background: white; padding: 15px; border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: grab;
        border-left: 4px solid var(--accent);
        transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        margin-bottom: 10px; position: relative;
    }
    .task-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
    
    /* --- HERO STYLES --- */
    .task-card.hero {
        transform: scale(1.05); /* Make it bigger */
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10;
        border: 2px solid #ba4949; /* Highlight border */
    }

    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .priority { font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
    
    .active-badge { font-size: 0.65rem; color: #ba4949; display: flex; align-items: center; gap: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

    .card-body h4 { margin: 0 0 4px 0; font-size: 1rem; color: #333; }
    .desc { margin: 0 0 10px 0; font-size: 0.8rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .meta { display: flex; gap: 10px; font-size: 0.75rem; color: #888; }
    .est { display: flex; align-items: center; gap: 4px; }
    .delete-btn { background: none; border: none; cursor: pointer; color: #ddd; padding: 0; }
    .delete-btn:hover { color: #f44336; }

    .progress-container { margin: 12px 0 0 0; position: relative; height: 6px; background: #eee; border-radius: 3px; }
    .progress-bar { height: 100%; background: #ba4949; border-radius: 3px; transition: width 0.5s; }
    .progress-text { position: absolute; right: 0; top: -18px; font-size: 0.7rem; color: #ba4949; font-weight: bold; }
</style>