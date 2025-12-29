<script>
    import { Trash2, Clock, PlayCircle } from 'lucide-svelte';
    import { deleteTask } from '$lib/stores/tasks';
    
    export let task;
    export let isHero = false; 
    export let showProgress = false; 

    // Calculate progress percentage
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

        <button class="delete-btn" on:click|stopPropagation={() => deleteTask(task.id)}>
            <Trash2 size={16} />
        </button>
    </div>

    <div class="card-body">
        <h4>{task.title}</h4>
        {#if task.description}
            <p class="desc">{task.description}</p>
        {/if}
        
        <div class="meta-row">
            <span class="meta-item"><Clock size={14}/> {task.estTime}m</span>
        </div>
    </div>

    {#if showProgress || task.timeSpent > 0}
        <div class="progress-section">
            <div class="progress-labels">
                <span>Progress</span>
                <span>{Math.floor(task.timeSpent)}/{task.estTime}m</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" 
                     style="width: {progressPct}%; background: {isHero ? '#ba4949' : 'var(--priority-color)'}">
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* 1. STANDARD CARD (Clean White) */
    .task-card {
        background: white; 
        border-radius: 16px; 
        padding: 18px;
        margin-bottom: 15px;
        
        /* Default State */
        border: 2px solid transparent; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
        
        cursor: grab;
        transition: all 0.2s ease;
        position: relative;
    }

    .task-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.08);
    }

    /* 2. HERO / ACTIVE TASK (The Highlight) */
    .task-card.hero {
        /* BORDER: Bright Gold instead of Red */
        border-color: #ffb142; 
        
        /* BACKGROUND: Very subtle warm tint */
        background: #fffdf5; 

        /* GLOW: 
           - 0 0: Centered
           - 30px: Blur radius (makes it wide and soft)
           - 5px: Spread radius (pushes it outward)
           - Color: Gold with 40% opacity 
        */
        box-shadow: 0 0 30px 5px rgba(255, 177, 66, 0.4);
        
        /* Ensure it sits above other cards */
        z-index: 10;
    }
    
    /* OPTIONAL: Update the text badge to match the Gold theme */
    .hero-label {
        font-size: 0.7rem;
        font-weight: 800;
        /* Match the gold border */
        color: #ffa502; 
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex; align-items: center; gap: 6px;
        margin-left: auto; margin-right: 15px;
        animation: pulse 2s infinite;
    }

    /* --- TYPOGRAPHY & LAYOUT --- */
    h4 { margin: 0 0 8px 0; font-size: 1.1rem; color: #2d3436; font-weight: 700; }
    .desc { font-size: 0.9rem; color: #636e72; margin: 0 0 15px 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    
    .card-top { display: flex; align-items: center; margin-bottom: 12px; }
    
    .priority-badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; }

    .delete-btn { margin-left: auto; background: transparent; border: none; color: #b2bec3; cursor: pointer; padding: 4px; }
    .delete-btn:hover { color: #d63031; }
    
    .meta-row { display: flex; gap: 15px; margin-bottom: 5px; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #b2bec3; font-weight: 500; }

    /* --- PROGRESS BAR --- */
    .progress-section { margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f2f6; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #636e72; margin-bottom: 6px; font-weight: 600; }
    .progress-track { height: 6px; background: #f1f2f6; width: 100%; border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 10px; transition: width 0.3s ease; }

    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
</style>