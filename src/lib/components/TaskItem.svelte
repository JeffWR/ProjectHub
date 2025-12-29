<script>
    import { Trash2, Clock, PlayCircle } from 'lucide-svelte';
    import { deleteTask } from '$lib/stores/tasks';
    
    export let task;
    export let isHero = false; 
    export let showProgress = false; // Add this back to control visibility

    $: progressPct = task.estTime > 0 ? Math.min(100, (task.timeSpent / task.estTime) * 100) : 0;
    const pColors = { Low: '#4caf50', Medium: '#ff9800', High: '#f44336' };
    $: pColor = pColors[task.priority] || '#999';
</script>

<div class="task-card" class:hero-mode={isHero} style="--accent: {pColor}">
    <div class="card-top">
        <span class="priority-badge" style="background: {pColor}15; color: {pColor}">
            {task.priority}
        </span>
        {#if isHero}
            <span class="active-indicator"><PlayCircle size={14} /> ACTIVE</span>
        {/if}
        <button class="delete-btn" on:click={() => deleteTask(task.id)}>
            <Trash2 size={16} />
        </button>
    </div>

    <div class="card-body">
        <h4>{task.title}</h4>
        {#if task.description}<p class="desc">{task.description}</p>{/if}
        
        <div class="meta-row">
            <span class="meta-item"><Clock size={12}/> {task.estTime}m est</span>
        </div>
    </div>

    {#if showProgress || task.timeSpent > 0}
        <div class="progress-section">
            <div class="progress-labels">
                <span>Progress</span>
                <span>{Math.floor(task.timeSpent)}m / {task.estTime}m</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: {progressPct}%"></div>
            </div>
        </div>
    {/if}
</div>

<style>
    .task-card {
        background: white; border-radius: 16px; padding: 18px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        border-left: 5px solid var(--accent);
        transition: all 0.2s ease; margin-bottom: 12px; cursor: grab;
    }
    .task-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px rgba(0,0,0,0.05); }

    .task-card.hero-mode {
        transform: scale(1.03); box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        border-color: #ba4949; z-index: 10;
    }
    
    .active-indicator {
        font-size: 0.7rem; font-weight: 800; color: #ba4949;
        display: flex; align-items: center; gap: 6px; animation: pulse 2s infinite;
    }

    h4 { margin: 0 0 6px 0; font-size: 1.05rem; color: #2d3436; font-weight: 600; }
    .desc { font-size: 0.85rem; color: #636e72; margin: 0 0 12px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .priority-badge { font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
    .delete-btn { background: transparent; border: none; color: #b2bec3; cursor: pointer; padding: 4px; }
    .delete-btn:hover { color: #d63031; }
    .meta-row { display: flex; gap: 15px; margin-bottom: 8px; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #95a5a6; }

    /* Progress Bar Styles */
    .progress-section { margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f2f6; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: #636e72; margin-bottom: 4px; font-weight: 600; }
    .progress-track { height: 6px; background: #f1f2f6; width: 100%; border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--accent); border-radius: 10px; transition: width 0.3s linear; }
    .hero-mode .progress-fill { background: linear-gradient(90deg, #ba4949, #ff7675); }

    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
</style>