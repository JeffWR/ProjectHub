<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { X, Trash2, Save } from 'lucide-svelte';
    import { tasks } from '$lib/stores/tasks';

    export let task; 

    const dispatch = createEventDispatcher();

    let title = task.title;
    let description = task.description || "";
    let priority = task.priority || "Medium";

    function saveChanges() {
        tasks.update(all => all.map(t => 
            t.id === task.id ? { ...t, title, description, priority } : t
        ));
        dispatch('close');
    }

    function deleteTask() {
        if(confirm('Are you sure you want to delete this task?')) {
            tasks.update(all => all.filter(t => t.id !== task.id));
            dispatch('close');
        }
    }
</script>

<div class="modal-backdrop" on:click|self={() => dispatch('close')} transition:fade={{ duration: 200 }}>
    <div class="modal-glass" transition:fly={{ y: 20, duration: 300 }}>
        
        <div class="modal-header">
            <input type="text" class="title-input" bind:value={title} placeholder="Task Title" />
            <button class="icon-btn" on:click={() => dispatch('close')}>
                <X size={24} />
            </button>
        </div>

        <div class="meta-row">
            <div class="priority-group">
                <label>Priority:</label>
                <select bind:value={priority} class="priority-select {priority}">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>
        </div>

        <div class="description-area">
            <label>Description</label>
            <textarea 
                bind:value={description} 
                placeholder="Add a more detailed description..."
            ></textarea>
        </div>

        <div class="modal-footer">
            <button class="btn-delete" on:click={deleteTask}>
                <Trash2 size={18} /> Delete
            </button>
            <button class="btn-save" on:click={saveChanges}>
                <Save size={18} /> Save Changes
            </button>
        </div>

    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
        display: flex; justify-content: center; align-items: center;
    }

    .modal-glass {
        width: 90%; max-width: 600px;
        background: rgba(30, 30, 30, 0.95);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; padding: 30px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        display: flex; flex-direction: column; gap: 20px;
        color: white; height: auto; max-height: 85vh;
    }

    .title-input {
        background: transparent; border: none; color: white;
        font-size: 1.8rem; font-weight: 700; width: 100%;
        outline: none; border-bottom: 2px solid transparent; padding-bottom: 5px;
    }
    .title-input:focus { border-bottom-color: #ff7675; }

    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .icon-btn { background: transparent; border: none; color: rgba(255,255,255,0.5); cursor: pointer; transition: 0.2s; }
    .icon-btn:hover { color: white; transform: rotate(90deg); }

    .meta-row { display: flex; gap: 20px; }
    .priority-group { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.6); }
    .priority-select {
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1);
        color: white; padding: 5px 10px; border-radius: 6px; cursor: pointer; outline: none;
    }
    .priority-select.High { color: #ff7675; border-color: rgba(255, 118, 117, 0.3); }
    .priority-select.Medium { color: #fdcb6e; border-color: rgba(253, 203, 110, 0.3); }
    .priority-select.Low { color: #55efc4; border-color: rgba(85, 239, 196, 0.3); }

    .description-area { display: flex; flex-direction: column; gap: 10px; flex: 1; min-height: 0; }
    .description-area label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.5); font-weight: 700; }
    textarea {
        background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px; color: rgba(255,255,255,0.9);
        padding: 15px; flex: 1; min-height: 200px; resize: none;
        font-family: inherit; font-size: 1rem; line-height: 1.5;
    }
    textarea:focus { outline: none; border-color: #ff7675; }

    .modal-footer { display: flex; justify-content: space-between; margin-top: 10px; }
    
    .btn-save {
        background: #ff7675; color: white; border: none;
        padding: 10px 20px; border-radius: 8px; font-weight: 600;
        display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s;
    }
    .btn-save:hover { background: #e17055; transform: translateY(-2px); }

    .btn-delete {
        background: transparent; border: 1px solid rgba(255, 71, 87, 0.3); color: #ff4757;
        padding: 10px 20px; border-radius: 8px; font-weight: 600;
        display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s;
    }
    .btn-delete:hover { background: rgba(255, 71, 87, 0.1); border-color: #ff4757; }
</style>