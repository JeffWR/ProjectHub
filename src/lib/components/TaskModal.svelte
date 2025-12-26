<script>
    import { fade, fly } from 'svelte/transition';
    import { X, Check } from 'lucide-svelte';

    export let isOpen = false;
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

    function handleSave() {
        if (!title.trim()) return;
        onSave({ title, description, priority, estTime });
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
                <h2>Create New Task</h2>
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
                        <input type="number" bind:value={estTime} min="5" step="5" />
                    </label>
                </div>
            </div>

            <div class="footer">
                <button class="save-btn" on:click={handleSave}>Create Task <Check size={18}/></button>
            </div>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
        z-index: 100; display: flex; align-items: center; justify-content: center;
    }
    .modal {
        background: white; color: #333; width: 90%; max-width: 500px;
        border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        overflow: hidden; font-family: 'Poppins', sans-serif;
    }
    .header {
        padding: 20px 30px; border-bottom: 1px solid #eee;
        display: flex; justify-content: space-between; align-items: center;
    }
    .header h2 { margin: 0; font-size: 1.2rem; }
    .close-btn { background: none; border: none; cursor: pointer; opacity: 0.5; transition: 0.2s; }
    .close-btn:hover { opacity: 1; transform: rotate(90deg); }

    .form-body { padding: 30px; display: flex; flex-direction: column; gap: 15px; }
    
    label { font-size: 0.85rem; font-weight: 600; color: #666; display: flex; flex-direction: column; gap: 8px; }
    input, textarea {
        padding: 12px; border-radius: 8px; border: 1px solid #ddd;
        font-family: inherit; font-size: 1rem; transition: 0.2s;
    }
    input:focus, textarea:focus { border-color: #ba4949; outline: none; }

    .row { display: flex; gap: 20px; }
    .row label { flex: 1; }

    .prio-selector { display: flex; background: #f5f5f5; padding: 4px; border-radius: 8px; }
    .prio-selector button {
        flex: 1; border: none; background: transparent; padding: 8px;
        font-size: 0.8rem; font-weight: 600; cursor: pointer; border-radius: 6px;
        color: #888; transition: 0.2s;
    }
    .prio-selector button.selected {
        background: white; color: var(--p-color); box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .footer { padding: 20px 30px; background: #f9f9f9; text-align: right; }
    .save-btn {
        background: #ba4949; color: white; border: none; padding: 12px 24px;
        border-radius: 12px; font-weight: 600; cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px;
        box-shadow: 0 4px 10px rgba(186, 73, 73, 0.3); transition: 0.2s;
    }
    .save-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(186, 73, 73, 0.4); }
</style>