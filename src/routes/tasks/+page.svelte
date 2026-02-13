<script>
    import { tasks, addTask, moveTask } from '$lib/stores/tasks';
    import TaskItem from '$lib/components/TaskItem.svelte';
    import TaskModal from '$lib/components/TaskModal.svelte';
    import TaskDetailModal from '$lib/components/TaskDetailModal.svelte';
    import { Plus, LayoutList } from 'lucide-svelte';
    import { onMount } from 'svelte';

    let showModal = false;
    let selectedTask = null;

    // Prevent hydration flash and trigger staggered animation
    let hydrated = false;
    onMount(() => {
        // Small delay ensures the browser paints the initial opacity: 0 state
        requestAnimationFrame(() => {
            hydrated = true;
        });
    });

    $: todoTasks = $tasks.filter(t => t.status === 'todo');
    $: progressTasks = $tasks.filter(t => t.status === 'inprogress');
    $: reviewTasks = $tasks.filter(t => t.status === 'review');

    function handleCreate(data) {
        addTask(data);
        showModal = false;
    }

    function openTaskDetail(task) {
        selectedTask = task;
    }

    // --- TRELLO-STYLE DRAG & DROP (from TaskBoard.svelte) ---
    let draggedTaskId = null;
    let dropTargetInfo = null; // { taskId, insertBefore: boolean }
    let autoScrollInterval = null;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let draggedTaskHeight = 80; // Default height, will be set on drag start

    function handleDragStart(event, id) {
        event.dataTransfer.setData('text/plain', id);
        event.dataTransfer.effectAllowed = 'move';
        draggedTaskId = id;

        // Capture the height of the dragged task for placeholder sizing
        const dragElement = event.currentTarget;
        draggedTaskHeight = dragElement.offsetHeight;

        // Calculate where the user clicked relative to the element
        const rect = dragElement.getBoundingClientRect();
        const offsetX = event.clientX - rect.left + 30; // +30 for wrapper padding
        const offsetY = event.clientY - rect.top + 30;  // +30 for wrapper padding

        // Create a wrapper with extra space for the tilted element
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = '-9999px';
        wrapper.style.left = '-9999px';
        wrapper.style.padding = '30px'; // Extra space for rotation overhang
        wrapper.style.overflow = 'visible';
        wrapper.style.pointerEvents = 'none';

        // Create the tilted clone
        const clone = dragElement.cloneNode(true);
        clone.style.transform = 'rotate(5deg)';
        clone.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
        clone.style.width = dragElement.offsetWidth + 'px';
        clone.style.opacity = '0.9';

        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        // Set the wrapper as the drag image with the click offset
        event.dataTransfer.setDragImage(wrapper, offsetX, offsetY);

        // Clean up after drag starts
        setTimeout(() => {
            if (document.body.contains(wrapper)) {
                document.body.removeChild(wrapper);
            }
        }, 0);

        // Start auto-scroll on drag
        startAutoScroll();
    }

    function handleDragEnd(event) {
        draggedTaskId = null;
        dropTargetInfo = null;
        stopAutoScroll();
    }

    // Auto-scroll functionality
    function startAutoScroll() {
        // Track mouse position during drag
        document.addEventListener('dragover', trackMousePosition);

        // Check for auto-scroll every 50ms
        autoScrollInterval = setInterval(() => {
            if (!draggedTaskId) return;

            // Find which scroll area the mouse is currently over
            const elementAtPoint = document.elementFromPoint(lastMouseX, lastMouseY);
            if (!elementAtPoint) return;

            // Find the closest scroll-area ancestor
            const scrollArea = elementAtPoint.closest('.scroll-area');
            if (!scrollArea) return;

            const rect = scrollArea.getBoundingClientRect();
            const scrollZone = 80; // px from edge to trigger scroll
            const scrollSpeed = 10; // px per interval

            // Near top - scroll up
            if (lastMouseY - rect.top < scrollZone && lastMouseY > rect.top) {
                scrollArea.scrollTop -= scrollSpeed;
            }
            // Near bottom - scroll down
            else if (rect.bottom - lastMouseY < scrollZone && lastMouseY < rect.bottom) {
                scrollArea.scrollTop += scrollSpeed;
            }
        }, 50);
    }

    function stopAutoScroll() {
        document.removeEventListener('dragover', trackMousePosition);
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }

    function trackMousePosition(event) {
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }

    function handleDragOver(event, task) {
        event.preventDefault();
        event.stopPropagation();

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
    }

    function handleZoneDrop(event, newStatus) {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');

        if (!id) return;

        // More forgiving: If we have position info from hovering, use it!
        if (dropTargetInfo && dropTargetInfo.taskId) {
            const targetTask = $tasks.find(t => t.id === dropTargetInfo.taskId);
            if (targetTask && targetTask.status === newStatus) {
                // Use the task drop handler with the remembered position
                const mockEvent = {
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    dataTransfer: event.dataTransfer
                };
                handleTaskDrop(mockEvent, targetTask);
                return;
            }
        }

        // Otherwise, append to end of column
        moveTask(id, newStatus);
        dropTargetInfo = null;
    }

    function handleTaskDrop(event, targetTask) {
        event.preventDefault();
        event.stopPropagation();

        const draggedId = event.dataTransfer.getData('text/plain');

        // Basic validation
        if (!draggedId || draggedId === targetTask.id) {
            dropTargetInfo = null;
            return;
        }

        // Find the dragged task
        const draggedTask = $tasks.find(t => t.id === draggedId);
        if (!draggedTask) {
            console.error('Task drop failed: Task not found');
            dropTargetInfo = null;
            return;
        }

        // If dropTargetInfo doesn't match this task, recalculate based on where we actually dropped
        if (!dropTargetInfo || dropTargetInfo.taskId !== targetTask.id) {
            // Default to inserting AFTER the target task
            dropTargetInfo = {
                taskId: targetTask.id,
                insertBefore: false
            };
        }

        // Calculate the correct insertion index
        const targetIndex = $tasks.findIndex(t => t.id === targetTask.id);
        const draggedIndex = $tasks.findIndex(t => t.id === draggedId);

        let insertIndex;

        if (dropTargetInfo.insertBefore) {
            // Insert BEFORE the target task
            insertIndex = targetIndex;
            // If dragging from above, compensate for the removal
            if (draggedIndex < targetIndex) {
                insertIndex--;
            }
        } else {
            // Insert AFTER the target task
            insertIndex = targetIndex + 1;
            // If dragging from above, compensate for the removal
            if (draggedIndex < targetIndex) {
                insertIndex--;
            }
        }

        moveTask(draggedId, targetTask.status, insertIndex);
        dropTargetInfo = null;
    }
</script>

<TaskModal isOpen={showModal} onClose={() => showModal = false} onSave={handleCreate} />

{#if selectedTask}
    <TaskDetailModal
        task={selectedTask}
        on:close={() => selectedTask = null}
    />
{/if}

<div class="grid-container">

    <div class="col-left">
        <div class="create-section">
            <button class="big-create-btn" on:click={() => showModal = true}>
                <div class="icon-circle"><Plus size={32} /></div>
                <span>Create New Task</span>
            </button>
        </div>

        <div class="section list-section"
             role="list"
             on:drop={(e) => handleZoneDrop(e, 'todo')}
             on:dragover|preventDefault>

            <div class="header"><h3>To Do</h3><span class="badge">{todoTasks.length}</span></div>
            <div class="scroll-area">
                {#each todoTasks as task, index (task.id)}
                    <!-- Show placeholder BEFORE task if cursor is in top half -->
                    {#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                        <div class="drop-placeholder"
                             style="height: {draggedTaskHeight}px"
                             on:drop={(e) => handleTaskDrop(e, task)}
                             on:dragover|preventDefault>
                            Drop here
                        </div>
                    {/if}

                    <!-- The task itself -->
                    <div
                        draggable="true"
                        class:being-dragged={draggedTaskId === task.id}
                        on:dragstart={(e) => handleDragStart(e, task.id)}
                        on:dragend={handleDragEnd}
                        on:dragover={(e) => handleDragOver(e, task)}
                        on:drop={(e) => handleTaskDrop(e, task)}
                        on:dblclick={() => openTaskDetail(task)}
                        role="listitem"
                        title="Double-click to view details"
                        style="opacity: {hydrated ? 1 : 0}; transform: translateY({hydrated ? 0 : 20}px); transition: opacity 0.6s ease-out {index * 0.12}s, transform 0.6s ease-out {index * 0.12}s"
                    >
                        <TaskItem {task} />
                    </div>

                    <!-- Show placeholder AFTER task if cursor is in bottom half -->
                    {#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                        <div class="drop-placeholder"
                             style="height: {draggedTaskHeight}px"
                             on:drop={(e) => handleTaskDrop(e, task)}
                             on:dragover|preventDefault>
                            Drop here
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    </div>

    <div class="col-mid section"
         role="list"
         on:drop={(e) => handleZoneDrop(e, 'inprogress')}
         on:dragover|preventDefault>

        <div class="header highlight"><h3>In Focus</h3><span class="badge">{progressTasks.length}</span></div>
        <div class="scroll-area">
            {#each progressTasks as task, index (task.id)}
                <!-- Show placeholder BEFORE task if cursor is in top half -->
                {#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                    <div class="drop-placeholder"
                         style="height: {draggedTaskHeight}px"
                         on:drop={(e) => handleTaskDrop(e, task)}
                         on:dragover|preventDefault>
                        Drop here
                    </div>
                {/if}

                <!-- The task itself -->
                <div
                    draggable="true"
                    class:being-dragged={draggedTaskId === task.id}
                    on:dragstart={(e) => handleDragStart(e, task.id)}
                    on:dragend={handleDragEnd}
                    on:dragover={(e) => handleDragOver(e, task)}
                    on:drop={(e) => handleTaskDrop(e, task)}
                    on:dblclick={() => openTaskDetail(task)}
                    role="listitem"
                    title="Double-click to view details"
                    style="opacity: {hydrated ? 1 : 0}; transform: translateY({hydrated ? 0 : 20}px); transition: opacity 0.6s ease-out {index * 0.12}s, transform 0.6s ease-out {index * 0.12}s"
                >
                    <TaskItem
                        {task}
                        showProgress={true}
                        isHero={index === 0}
                    />
                </div>

                <!-- Show placeholder AFTER task if cursor is in bottom half -->
                {#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                    <div class="drop-placeholder"
                         style="height: {draggedTaskHeight}px"
                         on:drop={(e) => handleTaskDrop(e, task)}
                         on:dragover|preventDefault>
                        Drop here
                    </div>
                {/if}
            {/each}

            {#if progressTasks.length === 0}
                <div class="empty-placeholder">Drag tasks here to work on them</div>
            {/if}
        </div>
    </div>

    <div class="col-right">
        <div class="section review-section"
             role="list"
             on:drop={(e) => handleZoneDrop(e, 'review')}
             on:dragover|preventDefault>

            <div class="header"><h3>Review</h3><span class="badge">{reviewTasks.length}</span></div>
            <div class="scroll-area">
                {#each reviewTasks as task, index (task.id)}
                    <!-- Show placeholder BEFORE task if cursor is in top half -->
                    {#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                        <div class="drop-placeholder"
                             style="height: {draggedTaskHeight}px"
                             on:drop={(e) => handleTaskDrop(e, task)}
                             on:dragover|preventDefault>
                            Drop here
                        </div>
                    {/if}

                    <!-- The task itself -->
                    <div
                        draggable="true"
                        class:being-dragged={draggedTaskId === task.id}
                        on:dragstart={(e) => handleDragStart(e, task.id)}
                        on:dragend={handleDragEnd}
                        on:dragover={(e) => handleDragOver(e, task)}
                        on:drop={(e) => handleTaskDrop(e, task)}
                        on:dblclick={() => openTaskDetail(task)}
                        role="listitem"
                        title="Double-click to view details"
                        style="opacity: {hydrated ? 1 : 0}; transform: translateY({hydrated ? 0 : 20}px); transition: opacity 0.6s ease-out {index * 0.12}s, transform 0.6s ease-out {index * 0.12}s"
                    >
                        <TaskItem {task} />
                    </div>

                    <!-- Show placeholder AFTER task if cursor is in bottom half -->
                    {#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
                        <div class="drop-placeholder"
                             style="height: {draggedTaskHeight}px"
                             on:drop={(e) => handleTaskDrop(e, task)}
                             on:dragover|preventDefault>
                            Drop here
                        </div>
                    {/if}
                {/each}
            </div>
        </div>

        <div class="section history-link-section">
            <a href="/stats" class="history-card">
                <div class="icon"><LayoutList size={24} /></div>
                <div><strong>Completed</strong><small>View History</small></div>
            </a>
        </div>
    </div>
</div>

<style>
    /* MAIN LAYOUT */
    .grid-container {
        display: grid;
        grid-template-columns: 1fr 1.5fr 1fr;
        gap: 20px;
        width: 100%;
        max-width: 1400px;
        height: 85vh;
        padding: 20px;
        box-sizing: border-box;
    }

    .col-left, .col-right { display: flex; flex-direction: column; gap: 20px; height: 100%; min-height: 0; }

    /* SECTIONS */
    .section {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
        min-width: 0;
        transition: background 0.2s;
    }
    .section:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); }

    .list-section, .col-mid, .review-section { flex: 1; min-height: 0; }

    /* --- THE SCROLLING & FADE MAGIC --- */
    .scroll-area {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;

        /* HIDE SCROLLBAR */
        scrollbar-width: none;
        -ms-overflow-style: none;

        /* FADE EFFECT */
        -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
        mask-image: linear-gradient(to bottom, black 85%, transparent 100%);

        padding: 20px;
        padding-bottom: 40px; /* Ensure last item isn't cut */

        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .scroll-area::-webkit-scrollbar { display: none; }

    /* --- HEADERS & BUTTONS --- */
    .create-section { flex: 0 0 auto; }
    .big-create-btn {
        width: 100%; height: 100px; background: white; color: #ba4949;
        border: none; border-radius: 24px; display: flex; align-items: center; gap: 20px; padding: 0 30px;
        font-family: 'Poppins', sans-serif; font-size: 1.2rem; font-weight: 700;
        cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        transition: 0.2s;
    }
    .big-create-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }
    .icon-circle { background: #ba4949; color: white; padding: 10px; border-radius: 50%; display: flex; }

    .header { display: flex; justify-content: space-between; margin-bottom: 15px; flex-shrink: 0; }
    .header h3 { margin: 0; font-size: 1.1rem; color: rgba(255,255,255,0.9); }
    .header.highlight h3 { color: white; font-size: 1.4rem; font-weight: 700; }
    .badge { background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; }
    .empty-placeholder { text-align: center; opacity: 0.5; margin-top: 50px; color: white; }

    .history-link-section { flex: 0 0 100px; padding: 0; background: rgba(0,0,0,0.2); border: none; }
    .history-card {
        display: flex; align-items: center; gap: 15px; width: 100%; height: 100%;
        text-decoration: none; color: white; padding: 0 25px; box-sizing: border-box;
    }

    /* --- TRELLO-STYLE DRAG & DROP EFFECTS --- */
    .being-dragged {
        opacity: 0.4;
        transform: scale(0.95);
        transition: opacity 0.2s, transform 0.2s;
    }

    .drop-placeholder {
        /* height set dynamically via inline style to match dragged task */
        min-height: 60px;
        background: rgba(255, 118, 117, 0.15);
        border: 2px dashed rgba(255, 118, 117, 0.5);
        border-radius: 12px;
        margin: 8px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 118, 117, 0.8);
        font-size: 0.9rem;
        font-weight: 600;
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% {
            background: rgba(255, 118, 117, 0.15);
            border-color: rgba(255, 118, 117, 0.5);
        }
        50% {
            background: rgba(255, 118, 117, 0.25);
            border-color: rgba(255, 118, 117, 0.7);
        }
    }

    [draggable="true"] {
        cursor: grab;
    }

    [draggable="true"]:active {
        cursor: grabbing;
    }
</style>
