<script>
    import { tasks, addTask, moveTask } from '$lib/stores/tasks';
    import TaskItem from '$lib/components/TaskItem.svelte';
    import TaskModal from '$lib/components/TaskModal.svelte';
    import TaskDetailModal from '$lib/components/TaskDetailModal.svelte'; // <--- NEW IMPORT
    import { Plus, LayoutList } from 'lucide-svelte';

    let showModal = false;
    let selectedTask = null; // <--- NEW STATE

    $: todoTasks = $tasks.filter(t => t.status === 'todo');
    $: progressTasks = $tasks.filter(t => t.status === 'inprogress');
    $: reviewTasks = $tasks.filter(t => t.status === 'review');

    function handleCreate(data) {
        addTask(data);
        showModal = false;
    }

    // --- DRAG AND DROP HANDLERS ---
    function handleDragStart(event, id) {
        event.dataTransfer.setData('text/plain', id);
        event.dataTransfer.effectAllowed = 'move';
    }

    function handleDrop(event, newStatus) {
        event.preventDefault(); 
        const id = parseInt(event.dataTransfer.getData('text/plain'));
        if (id) moveTask(id, newStatus);
    }
    
    function handleDragOver(event) {
        event.preventDefault(); 
    }

    // --- NEW: DOUBLE CLICK HANDLER ---
    function openTaskDetail(task) {
        selectedTask = task;
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
             on:drop={(e) => handleDrop(e, 'todo')} 
             on:dragover={handleDragOver}>
            
            <div class="header"><h3>To Do</h3><span class="badge">{todoTasks.length}</span></div>
            <div class="scroll-area">
                {#each todoTasks as task (task.id)}
                    <div 
                        draggable="true" 
                        on:dragstart={(e) => handleDragStart(e, task.id)} 
                        on:dblclick={() => openTaskDetail(task)}
                        role="listitem"
                        title="Double-click to view details"
                    >
                        <TaskItem {task} />
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <div class="col-mid section"
         role="list"
         on:drop={(e) => handleDrop(e, 'inprogress')} 
         on:dragover={handleDragOver}>
        
        <div class="header highlight"><h3>In Focus</h3><span class="badge">{progressTasks.length}</span></div>
        <div class="scroll-area">
            {#each progressTasks as task, index (task.id)}
                <div 
                    draggable="true" 
                    on:dragstart={(e) => handleDragStart(e, task.id)} 
                    on:dblclick={() => openTaskDetail(task)}
                    role="listitem"
                    title="Double-click to view details"
                >
                    <TaskItem 
                        {task} 
                        showProgress={true} 
                        isHero={index === 0} 
                    />
                </div>
            {/each}

            {#if progressTasks.length === 0}
                <div class="empty-placeholder">Drag tasks here to work on them</div>
            {/if}
        </div>
    </div>

    <div class="col-right">
        <div class="section review-section"
             role="list"
             on:drop={(e) => handleDrop(e, 'review')} 
             on:dragover={handleDragOver}>
            
            <div class="header"><h3>Review</h3><span class="badge">{reviewTasks.length}</span></div>
            <div class="scroll-area">
                {#each reviewTasks as task (task.id)}
                    <div 
                        draggable="true" 
                        on:dragstart={(e) => handleDragStart(e, task.id)} 
                        on:dblclick={() => openTaskDetail(task)}
                        role="listitem"
                        title="Double-click to view details"
                    >
                        <TaskItem {task} />
                    </div>
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
    }
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
</style>