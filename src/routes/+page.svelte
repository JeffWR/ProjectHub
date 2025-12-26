<script>
    import { tasks, addTask, moveTask, updateTaskDetails } from '$lib/stores/tasks';
    import TaskItem from '$lib/components/TaskItem.svelte';
    import TaskModal from '$lib/components/TaskModal.svelte';
    import { Plus, LayoutList } from 'lucide-svelte';

    let showModal = false;
    let editingTask = null; // Track task being edited

    $: todoTasks = $tasks.filter(t => t.status === 'todo');
    $: progressTasks = $tasks.filter(t => t.status === 'inprogress');
    $: reviewTasks = $tasks.filter(t => t.status === 'review');

    function handleSave(data) {
        if (data.id) {
            updateTaskDetails(data.id, data);
        } else {
            addTask(data);
        }
        closeModal();
    }

    function openEditModal(task) {
        editingTask = task;
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        editingTask = null;
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
</script>

<TaskModal 
    isOpen={showModal} 
    taskToEdit={editingTask}
    onClose={closeModal} 
    onSave={handleSave} 
/>

<div class="grid-container">
    
    <div class="col-left">
        <div class="create-section">
            <button class="big-create-btn" on:click={() => showModal = true}>
                <div class="icon-circle"><Plus size={24} /></div>
                <span>New Task</span>
            </button>
        </div>

        <div class="list-section">
            <div class="header">
                <h3>To Do ({todoTasks.length})</h3>
            </div>
            <div class="drop-zone" 
                 on:drop={(e) => handleDrop(e, 'todo')} 
                 on:dragover={handleDragOver}>
                
                {#each todoTasks as task (task.id)}
                    <div draggable="true" 
                         on:dragstart={(e) => handleDragStart(e, task.id)} 
                         on:dblclick={() => openEditModal(task)}
                         role="listitem" title="Double click to edit">
                        <TaskItem {task} />
                    </div>
                {/each}
                {#if todoTasks.length === 0}
                    <div class="empty-state">No tasks here yet</div>
                {/if}
            </div>
        </div>
    </div>

    <div class="col-mid">
        <div class="header">
            <h3>In Focus 🔥</h3>
        </div>
        <div class="drop-zone focus-zone" 
             on:drop={(e) => handleDrop(e, 'inprogress')} 
             on:dragover={handleDragOver}>
            
            {#each progressTasks as task (task.id)}
                <div draggable="true" 
                     on:dragstart={(e) => handleDragStart(e, task.id)} 
                     on:dblclick={() => openEditModal(task)}
                     role="listitem">
                    <TaskItem {task} showProgress={true} />
                </div>
            {/each}
            {#if progressTasks.length === 0}
                <div class="empty-state">Drag a task here to start timer</div>
            {/if}
        </div>
    </div>

    <div class="col-right">
        <div class="review-section">
            <div class="header">
                <h3>Completed</h3>
                <a href="/stats" class="stats-link"><LayoutList size={18}/> History</a>
            </div>
            <div class="drop-zone" 
                 on:drop={(e) => handleDrop(e, 'review')} 
                 on:dragover={handleDragOver}>
                
                {#each reviewTasks as task (task.id)}
                    <div draggable="true" 
                         on:dragstart={(e) => handleDragStart(e, task.id)} 
                         on:dblclick={() => openEditModal(task)}
                         role="listitem" class="dimmed">
                        <TaskItem {task} />
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .grid-container { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 30px; height: calc(100vh - 100px); min-height: 600px; padding-bottom: 20px; }
    .col-left { display: flex; flex-direction: column; gap: 30px; }
    .drop-zone { background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.1); border-radius: 16px; flex: 1; padding: 15px; overflow-y: auto; transition: 0.2s; }
    .drop-zone:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
    .focus-zone { background: rgba(186, 73, 73, 0.1); border-color: rgba(186, 73, 73, 0.3); }
    
    .create-section { flex: 0 0 auto; }
    .big-create-btn { width: 100%; height: 80px; background: white; color: #ba4949; border: none; border-radius: 20px; display: flex; align-items: center; gap: 20px; padding: 0 25px; font-family: inherit; font-size: 1.1rem; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.1); transition: 0.2s; }
    .big-create-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }
    .icon-circle { background: #ba4949; color: white; padding: 8px; border-radius: 50%; display: flex; }
    
    .list-section, .col-mid, .review-section { display: flex; flex-direction: column; height: 100%; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .header h3 { margin: 0; font-size: 1.1rem; color: rgba(255,255,255,0.9); }
    
    .stats-link { color: rgba(255,255,255,0.6); text-decoration: none; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; transition: 0.2s; }
    .stats-link:hover { color: white; }
    
    .empty-state { text-align: center; color: rgba(255,255,255,0.3); padding: 40px 20px; font-style: italic; }
    .dimmed { opacity: 0.7; }
</style>