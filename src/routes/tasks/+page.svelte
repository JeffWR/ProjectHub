<script>
    import { tasks, addTask, activeTaskId } from '$lib/stores/tasks';
    
    let newTitle = '';
    let newPriority = 'Low';
    
    function handleAdd() {
        if (!newTitle) return;
        addTask(newTitle, newPriority, 'General', 25);
        newTitle = '';
    }
</script>

<div class="glass-panel wide">
    <h2>Tasks</h2>
    
    <div class="input-group">
        <input bind:value={newTitle} placeholder="What needs to be done?" />
        <select bind:value={newPriority}>
            <option>Low</option>
            <option>High</option>
        </select>
        <button on:click={handleAdd}>+</button>
    </div>

    <ul class="list">
        {#each $tasks as task (task.id)}
            <li class="task-item" class:selected={$activeTaskId === task.id}>
                <div class="info">
                    <strong>{task.title}</strong>
                    <span class="badge">{task.priority}</span>
                </div>
                <button on:click={() => activeTaskId.set(task.id)}>
                    {$activeTaskId === task.id ? 'Active' : 'Select'}
                </button>
            </li>
        {/each}
    </ul>
</div>

<style>
    .glass-panel {
        background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
        width: 100%; max-width: 600px; height: 70vh; padding: 30px; border-radius: 20px;
        display: flex; flex-direction: column;
    }
    .wide { max-width: 800px; }
    
    .input-group { display: flex; gap: 10px; margin-bottom: 20px; }
    input { flex: 1; padding: 12px; border-radius: 8px; border: none; }
    button { cursor: pointer; border: none; border-radius: 8px; }

    .list { list-style: none; padding: 0; overflow-y: auto; }
    .task-item {
        background: rgba(0,0,0,0.1); padding: 15px; margin-bottom: 10px; border-radius: 10px;
        display: flex; justify-content: space-between; align-items: center;
    }
    .task-item.selected { border: 2px solid white; background: rgba(255,255,255,0.1); }
    .badge { font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; }
</style>