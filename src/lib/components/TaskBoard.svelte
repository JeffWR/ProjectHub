<script>
    import { tasks, moveTask } from '$lib/stores/tasks';
    import TaskItem from '$lib/components/TaskItem.svelte';
    import { Plus } from 'lucide-svelte';

    export let onEdit;
    export let onCreate;

    $: todoTasks = $tasks.filter(t => t.status === 'todo');
    $: progressTasks = $tasks.filter(t => t.status === 'inprogress');
    $: reviewTasks = $tasks.filter(t => t.status === 'review');

    // Trello-style drag state
    let draggedTaskId = null;
    let dropTargetInfo = null; // { taskId, insertBefore: boolean }

    function handleDragStart(event, id) {
        console.log('🚀 Drag start:', id);
        event.dataTransfer.setData('text/plain', id);
        event.dataTransfer.effectAllowed = 'move';
        draggedTaskId = id;
    }

    function handleDragEnd(event) {
        draggedTaskId = null;
        dropTargetInfo = null;
    }

    function handleDragOver(event, task) {
        event.preventDefault();
        event.stopPropagation(); // Prevent zone's dragover from interfering

        if (!draggedTaskId || draggedTaskId === task.id) {
            dropTargetInfo = null;
            return;
        }

        // Calculate if cursor is in top half or bottom half of the task
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseY = event.clientY;
        const taskMiddle = rect.top + (rect.height / 2);
        const insertBefore = mouseY < taskMiddle;

        // Update drop target info
        dropTargetInfo = {
            taskId: task.id,
            insertBefore: insertBefore
        };

        console.log('🔍 Drag over:', {
            task: task.title,
            insertBefore,
            mouseY,
            taskMiddle
        });
    }

    function handleZoneDrop(event, newStatus) {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');
        if (id) {
            console.log('🎯 Zone drop:', { id, newStatus });
            moveTask(id, newStatus);
        }
    }
    
    function handleTaskDrop(event, targetTask) {
        event.preventDefault();
        event.stopPropagation();

        const draggedId = event.dataTransfer.getData('text/plain');

        if (!draggedId || draggedId === targetTask.id || !dropTargetInfo) {
            dropTargetInfo = null;
            return;
        }

        // Find the dragged task
        const draggedTask = $tasks.find(t => t.id === draggedId);
        if (!draggedTask) {
            console.error('❌ Dragged task not found');
            dropTargetInfo = null;
            return;
        }

        // Calculate the correct insertion index
        const targetIndex = $tasks.findIndex(t => t.id === targetTask.id);
        const draggedIndex = $tasks.findIndex(t => t.id === draggedId);

        let insertIndex;

        if (dropTargetInfo.insertBefore) {
            // Insert BEFORE the target task
            insertIndex = targetIndex;
            // If dragging from above to below, adjust index
            if (draggedIndex < targetIndex) {
                insertIndex--;
            }
        } else {
            // Insert AFTER the target task
            insertIndex = targetIndex + 1;
            // If dragging from above to below, adjust index
            if (draggedIndex < targetIndex) {
                insertIndex--;
            }
        }

        console.log('📍 Moving task:', {
            from: draggedTask.title,
            to: targetTask.title,
            draggedIndex,
            targetIndex,
            insertBefore: dropTargetInfo.insertBefore,
            finalInsertIndex: insertIndex,
            newStatus: targetTask.status
        });

        moveTask(draggedId, targetTask.status, insertIndex);
        dropTargetInfo = null;
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
                <!-- Show placeholder BEFORE task if cursor is in top half -->
                {#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                    <div class="drop-placeholder">Drop here</div>
                {/if}

                <!-- The task itself -->
                <div role="listitem"
                     draggable="true"
                     class:being-dragged={draggedTaskId === task.id}
                     on:dragstart={(e) => handleDragStart(e, task.id)}
                     on:dragend={handleDragEnd}
                     on:dragover={(e) => handleDragOver(e, task)}
                     on:drop={(e) => handleTaskDrop(e, task)}
                     on:dblclick={() => onEdit(task)}>
                    <TaskItem {task} />
                </div>

                <!-- Show placeholder AFTER task if cursor is in bottom half -->
                {#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                    <div class="drop-placeholder">Drop here</div>
                {/if}
            {/each}
        </div>
    </div>

    <div class="col-wrapper">
        <div class="list-header focus-header">In Focus 🔥</div>
        <div class="drop-zone focus-zone" on:drop={(e) => handleZoneDrop(e, 'inprogress')} on:dragover|preventDefault>
            {#each progressTasks as task, index (task.id)}
                <!-- Show placeholder BEFORE task if cursor is in top half -->
                {#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                    <div class="drop-placeholder">Drop here</div>
                {/if}

                <!-- The task itself -->
                <div role="listitem"
                     draggable="true"
                     class:being-dragged={draggedTaskId === task.id}
                     class:hero-spacer={index === 0}
                     on:dragstart={(e) => handleDragStart(e, task.id)}
                     on:dragend={handleDragEnd}
                     on:dragover={(e) => handleDragOver(e, task)}
                     on:drop={(e) => handleTaskDrop(e, task)}
                     on:dblclick={() => onEdit(task)}>
                    <TaskItem {task} isHero={index === 0} showProgress={true} />
                </div>

                <!-- Show placeholder AFTER task if cursor is in bottom half -->
                {#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                    <div class="drop-placeholder">Drop here</div>
                {/if}
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
                <!-- Show placeholder BEFORE task if cursor is in top half -->
                {#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                    <div class="drop-placeholder">Drop here</div>
                {/if}

                <!-- The task itself -->
                <div role="listitem"
                     draggable="true"
                     class:being-dragged={draggedTaskId === task.id}
                     class="dimmed"
                     on:dragstart={(e) => handleDragStart(e, task.id)}
                     on:dragend={handleDragEnd}
                     on:dragover={(e) => handleDragOver(e, task)}
                     on:drop={(e) => handleTaskDrop(e, task)}
                     on:dblclick={() => onEdit(task)}>
                    <TaskItem {task} />
                </div>

                <!-- Show placeholder AFTER task if cursor is in bottom half -->
                {#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                    <div class="drop-placeholder">Drop here</div>
                {/if}
            {/each}
        </div>
    </div>
</div>

<style>
    /* 1. Force the grid to stay inside the parent container */
    .board-grid { 
        display: grid; 
        grid-template-columns: 1fr 1.2fr 1fr; 
        gap: 25px; 
        height: 100%; 
        width: 100%; 
        overflow: hidden; 
    }

    /* 2. The column wrapper */
    .col-wrapper { 
        display: flex; 
        flex-direction: column; 
        height: 100%; 
        gap: 15px; 
        min-width: 0; 
        min-height: 0; 
        position: relative; /* Needed for the fade effect context */
    }

    .list-header { 
        font-weight: 700; 
        color: rgba(255,255,255,0.6); 
        display: flex; 
        justify-content: space-between; 
        padding: 0 5px;
        flex-shrink: 0; 
    }

    /* 3. THE SCROLLING ZONE WITH FADE EFFECT */
    .drop-zone { 
        flex: 1; 
        background: rgba(255,255,255,0.02); 
        border-radius: 20px; 
        padding: 10px; 
        
        /* SCROLLING LOGIC */
        overflow-y: auto; 
        overflow-x: hidden;
        
        /* THE FADE EFFECT (Masking) */
        /* This makes the bottom 20px transparent */
        -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
        mask-image: linear-gradient(to bottom, black 85%, transparent 100%);

        border: 2px dashed transparent; 
        transition: 0.2s; 
        
        /* Add some padding at the bottom so the last task isn't cut off by the fade */
        padding-bottom: 40px; 
    }

    /* Hide scrollbar by default for a cleaner "Phone" look, show on hover */
    .drop-zone::-webkit-scrollbar {
        width: 6px;
    }
    .drop-zone::-webkit-scrollbar-track {
        background: transparent; 
    }
    .drop-zone::-webkit-scrollbar-thumb {
        background: transparent; /* Hidden by default */
        border-radius: 10px;
    }
    .drop-zone:hover::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2); /* Visible on hover */
    }

    /* ... Existing styles ... */
    .focus-header { color: #ff7675; text-shadow: 0 0 10px rgba(255, 118, 117, 0.3); }
    .count { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
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