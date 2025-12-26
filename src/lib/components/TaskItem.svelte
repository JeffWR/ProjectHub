<script>
    import { activeTaskId } from '$lib/stores/tasks';
    export let task; // The task object passed from the parent

    // Helper to toggle selection
    function selectTask() {
        activeTaskId.set(task.id);
    }
</script>

<li class="task-item" class:selected={$activeTaskId === task.id}>
    <div class="main-row">
        <div class="info">
            <span class="title">{task.title}</span>
            <div class="meta">
                <span class="badge priority-{task.priority.toLowerCase()}">{task.priority}</span>
                <span class="category">{task.category}</span>
            </div>
        </div>
        <button class="select-btn" on:click={selectTask}>
            {$activeTaskId === task.id ? 'Active' : 'Select'}
        </button>
    </div>
    
    {#if task.subtasks && task.subtasks.length > 0}
        <ul class="subtask-list">
            {#each task.subtasks as sub}
                <li>{sub.title}</li>
            {/each}
        </ul>
    {/if}
</li>

<style>
    .task-item {
        background: rgba(0,0,0,0.15);
        margin-bottom: 10px;
        border-radius: 12px;
        padding: 15px;
        transition: 0.2s;
        border: 2px solid transparent;
    }
    .task-item.selected {
        border-color: white;
        background: rgba(255,255,255,0.1);
    }
    .main-row { display: flex; justify-content: space-between; align-items: center; }
    .title { font-weight: bold; display: block; margin-bottom: 4px; }
    .meta { display: flex; gap: 8px; font-size: 0.75rem; opacity: 0.8; }
    .badge { padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.2); }
    .select-btn {
        background: rgba(255,255,255,0.1); border: none; color: white;
        padding: 6px 12px; border-radius: 6px; cursor: pointer;
    }
    .select-btn:hover { background: white; color: #ba4949; }
</style>