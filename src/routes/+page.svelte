<script>
    import { addTask, updateTask } from '$lib/stores/tasks';
    import TaskBoard from '$lib/components/TaskBoard.svelte';
    import TaskModal from '$lib/components/TaskModal.svelte';

    let showModal = false;
    let editingTask = null;

    function handleSave(data) {
        if (data.id) updateTask(data.id, data);
        else addTask(data);
        closeModal();
    }
    
    function openEditModal(task) { editingTask = task; showModal = true; }
    function closeModal() { showModal = false; editingTask = null; }
</script>

<TaskModal 
    isOpen={showModal} 
    taskToEdit={editingTask} 
    onClose={closeModal} 
    onSave={handleSave} 
/>

<div class="page-container">
    <TaskBoard 
        onEdit={openEditModal} 
        onCreate={() => showModal = true} 
    />
</div>

<style>
    .page-container {
        height: calc(100vh - 100px);
        padding-bottom: 20px;
        width: 100%;
        margin: 0 auto;
    }
</style>