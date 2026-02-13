<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { X, Trash2, Calendar, Flag, AlignLeft } from 'lucide-svelte';
    import { tasks } from '$lib/stores/tasks';

    export let task; 

    const dispatch = createEventDispatcher();

    let title = task.title;
    let description = task.description || "";
    let priority = task.priority || "Medium";

    const dateCreated = new Date(task.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
    });

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
    
    <div class="modal-glass" transition:scale={{ start: 0.95, duration: 200 }}>
        
        <div class="modal-header">
            <div class="header-meta">
                <span class="date-badge"><Calendar size={13} /> {dateCreated}</span>
                <span class="id-badge">#{task.id}</span>
            </div>
            <button class="close-btn" on:click={() => dispatch('close')}>
                <X size={24} />
            </button>
        </div>

        <div class="title-section">
            <input 
                type="text" 
                class="title-input" 
                bind:value={title} 
                placeholder="Task Title" 
            />
        </div>

        <div class="meta-row">
            <div class="label"><Flag size={16} /> Priority</div>
            <div class="priority-options">
                {#each ['High', 'Medium', 'Low'] as p}
                    <button 
                        class="p-btn {p} {priority === p ? 'active' : ''}" 
                        on:click={() => priority = p}
                    >
                        {p}
                    </button>
                {/each}
            </div>
        </div>

        <div class="description-section">
            <div class="label"><AlignLeft size={16} /> Description</div>
            
            <div class="textarea-wrapper">
                <textarea 
                    bind:value={description} 
                    placeholder="Add more details..."
                ></textarea>
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-delete" on:click={deleteTask} title="Delete Task">
                <Trash2 size={20} />
            </button>
            <button class="btn-save" on:click={saveChanges}>
                <span>Save Changes</span>
            </button>
        </div>

    </div>
</div>

<style>
    /* 1. SCROLLBAR HIDING */
    textarea { -ms-overflow-style: none; scrollbar-width: none; }
    textarea::-webkit-scrollbar { display: none; }

    /* 2. BACKDROP */
    .modal-backdrop {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0, 0, 0, 0.6); 
        backdrop-filter: blur(8px);
        display: flex; justify-content: center; align-items: center;
        padding: 20px;
    }

    /* 3. MAIN MODAL (Compact auto-height layout) */
    .modal-glass {
        width: 100%; max-width: 600px;
        /* Let it grow naturally, but don't overflow screen */
        height: auto; max-height: 85vh; 
        overflow-y: auto; /* Scroll the modal itself if it gets too tall */

        background: rgba(30, 30, 30, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 30px;
        box-shadow: 0 40px 80px rgba(0,0,0,0.6);
        
        display: flex; flex-direction: column; gap: 20px;
        color: white; font-family: sans-serif;
    }
    /* Hide scrollbar on the modal itself */
    .modal-glass::-webkit-scrollbar { display: none; }

    /* 4. HEADER */
    .modal-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .header-meta { display: flex; gap: 10px; }
    .date-badge, .id-badge {
        font-size: 0.75rem; color: rgba(255,255,255,0.4);
        background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 8px;
        display: flex; align-items: center; gap: 6px;
    }
    .close-btn {
        background: transparent; border: none; color: rgba(255,255,255,0.4);
        cursor: pointer; transition: 0.2s; padding: 5px; border-radius: 50%; display: flex;
    }
    .close-btn:hover { background: rgba(255,255,255,0.1); color: white; }

    /* 5. TITLE */
    .title-input {
        background: transparent; border: none; color: white;
        font-size: 1.8rem; font-weight: 700; width: 100%;
        outline: none; padding: 5px 0;
        border-bottom: 2px solid transparent; transition: border-color 0.2s;
    }
    .title-input:focus { border-bottom-color: rgba(255,255,255,0.2); }
    .title-input::placeholder { color: rgba(255,255,255,0.2); }

    /* 6. META & PRIORITY */
    .label { 
        font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; 
        color: rgba(255,255,255,0.5); font-weight: 700; display: flex; align-items: center; gap: 8px;
        margin-bottom: 10px;
    }
    .priority-options { display: flex; gap: 10px; }
    .p-btn {
        background: rgba(255,255,255,0.05); border: 1px solid transparent; 
        color: rgba(255,255,255,0.6); padding: 8px 18px; border-radius: 12px;
        font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .p-btn.active.High { background: rgba(255, 118, 117, 0.2); color: #ff7675; border-color: #ff7675; }
    .p-btn.active.Medium { background: rgba(253, 203, 110, 0.2); color: #fdcb6e; border-color: #fdcb6e; }
    .p-btn.active.Low { background: rgba(85, 239, 196, 0.2); color: #55efc4; border-color: #55efc4; }
    .p-btn:hover:not(.active) { background: rgba(255,255,255,0.1); color: white; }

    /* 7. DESCRIPTION (FIXED) */
    .description-section { 
        display: flex; flex-direction: column; 
        /* Removed flex:1 so it doesn't push the modal height unnecessarily */
    }
    
    .textarea-wrapper {
        background: rgba(0,0,0,0.2); border-radius: 16px; 
        border: 1px solid rgba(255,255,255,0.05);
        /* Specific height so it feels like a big box */
        height: 300px; 
        display: flex; flex-direction: column;
        padding: 5px; 
    }

    textarea {
        flex: 1; /* Fills the 300px wrapper */
        width: 100%; height: 100%; 
        resize: none; border: none; background: transparent;
        color: rgba(255,255,255,0.9); padding: 15px; 
        font-family: inherit; font-size: 1rem; line-height: 1.6;
        overflow-y: auto; 
    }
    textarea:focus { outline: none; }

    /* 8. FOOTER */
    .modal-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
    
    .btn-delete {
        width: 50px; height: 50px; border-radius: 16px;
        background: rgba(255, 71, 87, 0.1); color: #ff4757;
        border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: 0.2s;
    }
    .btn-delete:hover { background: rgba(255, 71, 87, 0.2); transform: scale(1.05); }

    .btn-save {
        background: white; color: #ba4949; border: none;
        padding: 0 40px; height: 50px; border-radius: 16px;
        font-weight: 800; font-size: 1rem; cursor: pointer;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2); transition: transform 0.1s;
    }
    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
    .btn-save:active { transform: translateY(0); }
</style>