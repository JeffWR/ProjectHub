<script>
    import { fade, fly } from 'svelte/transition';
    import { X, Check } from 'lucide-svelte';

    export let isOpen = false;
    export let taskToEdit = null; // NEW: Accepts a task object
    export let onSave;
    export let onClose;

    let title = '';
    let description = '';
    let priority = 'Medium';
    let estTime = 25;

    const priorities = [
        { name: 'Low', color: '#4caf50' },
        { name: 'Medium', color: '#ff9800' },
        { name: 'High', color: '#f44336' }
    ];

    // Reactive: Update form fields when taskToEdit changes
    $: if (taskToEdit) {
        title = taskToEdit.title;
        description = taskToEdit.description;
        priority = taskToEdit.priority;
        estTime = taskToEdit.estTime;
    } else if (!isOpen) {
        // Only clear form when modal is fully closed
        reset(); 
    }

    function handleSave() {
        if (!title.trim()) return;
        
        // Pass back ID if editing, otherwise just the new data
        onSave({ 
            id: taskToEdit?.id, 
            title, description, priority, estTime 
        });
        
        reset();
    }

    function reset() {
        title = ''; description = ''; priority = 'Medium'; estTime = 25;
    }
</script>

{#if isOpen}
    <div class="backdrop" transition:fade on:click={onClose}>
        <div class="modal" transition:fly={{ y: 20 }} on:click|stopPropagation>
            <div class="header">
                <h2>{taskToEdit ? 'Edit Task' : 'Create New Task'}</h2>
                <button class="close-btn" on:click={onClose}><X size={20}/></button>
            </div>

            <div class="form-body">
                <label>Task Name
                    <input type="text" bind:value={title} placeholder="e.g. Design Homepage" autofocus />
                </label>

                <label>Description
                    <textarea bind:value={description} rows="2" placeholder="Add details..."></textarea>
                </label>

                <div class="row">
                    <label>Priority
                        <div class="prio-selector">
                            {#each priorities as p}
                                <button 
                                    class:selected={priority === p.name}
                                    style="--p-color: {p.color}"
                                    on:click={() => priority = p.name}
                                >
                                    {p.name}
                                </button>
                            {/each}
                        </div>
                    </label>

                    <label>Est. Time (min)
                        <input type="number" bind:value={estTime} min="1" max="120" />
                    </label>
                </div>
            </div>

            <div class="footer">
                <button class="save-btn" on:click={handleSave}>
                    {taskToEdit ? 'Save Changes' : 'Create Task'} <Check size={18}/>
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal { background: white; width: 90%; max-width: 500px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; }
    
    .header { padding: 20px 30px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    .header h2 { margin: 0; font-size: 1.2rem; color: #333; }
    .close-btn { background: none; border: none; cursor: pointer; color: #999; transition: 0.2s; }
    .close-btn:hover { opacity: 1; transform: rotate(90deg); color: #ba4949; }

    .form-body { padding: 30px; display: flex; flex-direction: column; gap: 15px; }
    
    label { font-size: 0.85rem; font-weight: 600; color: #666; display: flex; flex-direction: column; gap: 8px; }
    input, textarea { padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-family: inherit; font-size: 1rem; transition: 0.2s; }
    input:focus, textarea:focus { border-color: #ba4949; outline: none; }

    .row { display: flex; gap: 20px; }
    .row label { flex: 1; }

    .prio-selector { display: flex; background: #f5f5f5; padding: 4px; border-radius: 8px; }
    .prio-selector button { flex: 1; border: none; background: transparent; padding: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-radius: 6px; color: #888; transition: 0.2s; }
    .prio-selector button.selected { background: white; color: var(--p-color); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

    .footer { padding: 20px 30px; background: #f9f9f9; text-align: right; }
    .save-btn { background: #ba4949; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; }
    .save-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(186, 73, 73, 0.4); }
</style>