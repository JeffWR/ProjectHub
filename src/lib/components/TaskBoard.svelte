<script>
    import { tasks, moveTask } from '$lib/stores/tasks';
    import TaskItem from '$lib/components/TaskItem.svelte';
    import { Plus } from 'lucide-svelte';

    export let onEdit;   
    export let onCreate; 

    $: todoTasks = $tasks.filter(t => t.status === 'todo');
    $: progressTasks = $tasks.filter(t => t.status === 'inprogress');
    $: reviewTasks = $tasks.filter(t => t.status === 'review');

    function handleDragStart(event, id) {
        event.dataTransfer.setData('text/plain', id);
        event.dataTransfer.effectAllowed = 'move';
    }

    function handleZoneDrop(event, newStatus) {
        const id = parseInt(event.dataTransfer.getData('text/plain'));
        if (id) moveTask(id, newStatus); 
    }
    
    function handleTaskDrop(event, targetTask) {
        event.preventDefault();
        event.stopPropagation();
        const draggedId = parseInt(event.dataTransfer.getData('text/plain'));
        if (!draggedId || draggedId === targetTask.id) return;
        const targetIndex = $tasks.findIndex(t => t.id === targetTask.id);
        moveTask(draggedId, targetTask.status, targetIndex);
    }
</script>

<div class="board-grid">
    <div class="col-wrapper">
        <button class="create-card" on:click={onCreate}>
            <div class="icon-bg"><Plus size={24} /></div>
            <span>New Task</span>
        </button>
        <div class="list-header">To Do <span class="count">{todoTasks.length}</span></div>
        <div class="drop-zone" on:drop={(e) => handleZoneDrop(e, 'todo')} on:dragover|preventDefault>
            {#each todoTasks as task (task.id)}
                <div role="listitem" draggable="true" 
                     on:dragstart={(e) => handleDragStart(e, task.id)} 
                     on:drop={(e) => handleTaskDrop(e, task)} 
                     on:dragover|preventDefault
                     on:dblclick={() => onEdit(task)}>
                    <TaskItem {task} />
                </div>
            {/each}
        </div>
    </div>

    <div class="col-wrapper">
        <div class="list-header focus-header">In Focus 🔥</div>
        <div class="drop-zone focus-zone" on:drop={(e) => handleZoneDrop(e, 'inprogress')} on:dragover|preventDefault>
            {#each progressTasks as task, index (task.id)}
                <div role="listitem" draggable="true" 
                     on:dragstart={(e) => handleDragStart(e, task.id)} 
                     on:drop={(e) => handleTaskDrop(e, task)} 
                     on:dragover|preventDefault
                     on:dblclick={() => onEdit(task)}
                     class:hero-spacer={index === 0}>
                    <TaskItem {task} isHero={index === 0} showProgress={true} />
                </div>
            {/each}
            {#if progressTasks.length === 0}
                <div class="empty-state">Drag task here to start timer</div>
            {/if}
        </div>
    </div>

    <div class="col-wrapper">
        <div class="list-header">Completed <span class="count">{reviewTasks.length}</span></div>
        <div class="drop-zone" on:drop={(e) => handleZoneDrop(e, 'review')} on:dragover|preventDefault>
            {#each reviewTasks as task (task.id)}
                <div role="listitem" draggable="true" 
                     on:dragstart={(e) => handleDragStart(e, task.id)} 
                     on:drop={(e) => handleTaskDrop(e, task)} 
                     on:dragover|preventDefault
                     class="dimmed">
                    <TaskItem {task} />
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .board-grid { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 25px; height: 100%; width: 100%; }
    .col-wrapper { display: flex; flex-direction: column; height: 100%; gap: 15px; min-width: 0; }
    .list-header { font-weight: 700; color: rgba(255,255,255,0.6); display: flex; justify-content: space-between; padding: 0 5px; }
    .focus-header { color: #ff7675; text-shadow: 0 0 10px rgba(255, 118, 117, 0.3); }
    .count { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
    .drop-zone { flex: 1; background: rgba(255,255,255,0.02); border-radius: 20px; padding: 10px; overflow-y: auto; border: 2px dashed transparent; transition: 0.2s; }
    .drop-zone:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
    .focus-zone { background: linear-gradient(180deg, rgba(186, 73, 73, 0.05) 0%, rgba(0,0,0,0) 100%); }
    .create-card { background: white; border: none; padding: 20px; border-radius: 16px; display: flex; align-items: center; gap: 15px; cursor: pointer; font-weight: 600; color: #ba4949; transition: 0.2s; flex-shrink: 0; }
    .create-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    .icon-bg { background: #ba4949; color: white; padding: 8px; border-radius: 50%; display: flex; }
    .empty-state { text-align: center; color: rgba(255,255,255,0.2); margin-top: 50px; font-style: italic; border: 2px dashed rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; }
    .dimmed { opacity: 0.6; filter: grayscale(0.5); }
    .hero-spacer { margin-bottom: 30px; position: relative; }
    .hero-spacer::after { content: 'Up Next'; position: absolute; bottom: -25px; left: 0; width: 100%; text-align: center; font-size: 0.7rem; color: rgba(255,255,255,0.2); letter-spacing: 2px; text-transform: uppercase; }
    .hero-spacer:last-child::after { display: none; }
</style>