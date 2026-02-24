<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { X, Trash2, Calendar, Flag, AlignLeft, Clock } from 'lucide-svelte';
    import { tasks, updateTask } from '$lib/stores/tasks';

    export let task;

    const dispatch = createEventDispatcher();

    let title = task.title;
    let description = task.description || "";
    let priority = task.priority || "Medium";

    const originalMinutes = task.estTime || 25;
    let estMinutes = originalMinutes;
    let timeRaw = String(estMinutes); // string so the field can be empty while editing

    function onTimeInput(e) {
        timeRaw = e.target.value;
    }

    function onTimeBlur() {
        const parsed = parseInt(timeRaw, 10);
        if (!timeRaw || isNaN(parsed) || parsed < 1) {
            estMinutes = originalMinutes;
        } else {
            estMinutes = Math.min(parsed, 999);
        }
        timeRaw = String(estMinutes);
    }

    const dateCreated = new Date(task.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
    });

    function saveChanges() {
        const totalMinutes = estMinutes;
        updateTask(task.id, { title, description, priority, estTime: totalMinutes });
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

        <div class="meta-row priority-time-meta">
            <div class="meta-col">
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
            <div class="meta-col right">
                <div class="label"><Clock size={16} /> Est. Time</div>
                <div class="time-field">
                    <input
                        type="number"
                        class="time-input"
                        value={timeRaw}
                        placeholder={String(originalMinutes)}
                        min="1"
                        max="999"
                        on:input={onTimeInput}
                        on:blur={onTimeBlur}
                    />
                    <span class="time-unit">min</span>
                </div>
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
        height: auto; max-height: 85vh;
        overflow-y: auto;

        background: var(--surface-modal);
        border: 1px solid var(--border-strong);
        border-radius: 24px;
        padding: 30px;
        box-shadow: 0 40px 80px rgba(0,0,0,0.6), var(--shadow);

        display: flex; flex-direction: column; gap: 20px;
        color: var(--text-primary); font-family: sans-serif;
    }
    /* Hide scrollbar on the modal itself */
    .modal-glass::-webkit-scrollbar { display: none; }

    /* 4. HEADER */
    .modal-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .header-meta { display: flex; gap: 10px; }
    .date-badge, .id-badge {
        font-size: 0.75rem; color: var(--text-faint);
        background: var(--surface); padding: 4px 10px; border-radius: 8px;
        display: flex; align-items: center; gap: 6px;
    }
    .close-btn {
        background: transparent; border: none; color: var(--text-faint);
        cursor: pointer; transition: 0.2s; padding: 5px; border-radius: 50%; display: flex;
    }
    .close-btn:hover { background: var(--surface); color: var(--text-primary); }

    /* 5. TITLE */
    .title-input {
        background: transparent; border: none; color: var(--text-primary);
        font-size: 1.8rem; font-weight: 700; width: 100%;
        outline: none; padding: 5px 0;
        border-bottom: 2px solid transparent; transition: border-color 0.2s;
    }
    .title-input:focus { border-bottom-color: var(--border-strong); }
    .title-input::placeholder { color: var(--text-faint); }

    /* 6. META & PRIORITY */
    .label {
        font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;
        color: var(--text-muted); font-weight: 700; display: flex; align-items: center; gap: 8px;
        margin-bottom: 10px;
    }
    .priority-options { display: flex; gap: 10px; }
    .p-btn {
        background: var(--surface); border: 1px solid transparent;
        color: var(--text-secondary); padding: 8px 18px; border-radius: 12px;
        font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .p-btn.active.High { background: rgba(255, 118, 117, 0.2); color: #ff7675; border-color: #ff7675; }
    .p-btn.active.Medium { background: rgba(253, 203, 110, 0.2); color: #fdcb6e; border-color: #fdcb6e; }
    .p-btn.active.Low { background: rgba(85, 239, 196, 0.2); color: #55efc4; border-color: #55efc4; }
    .p-btn:hover:not(.active) { background: var(--surface-hover); color: var(--text-primary); }

    /* 7. DESCRIPTION (FIXED) */
    .description-section { 
        display: flex; flex-direction: column; 
        /* Removed flex:1 so it doesn't push the modal height unnecessarily */
    }
    
    .textarea-wrapper {
        background: var(--input-bg); border-radius: 16px;
        border: 1px solid var(--border);
        /* Specific height so it feels like a big box */
        height: 300px; 
        display: flex; flex-direction: column;
        padding: 5px; 
    }

    textarea {
        flex: 1;
        width: 100%; height: 100%;
        resize: none; border: none; background: transparent;
        color: var(--text-primary); padding: 15px;
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
        background: white; color: var(--color-primary); border: none;
        padding: 0 40px; height: 50px; border-radius: 16px;
        font-weight: 800; font-size: 1rem; cursor: pointer;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2); transition: transform 0.1s;
    }
    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
    .btn-save:active { transform: translateY(0); }

    /* PRIORITY + TIME ROW */
    .priority-time-meta { display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; }
    .meta-col { display: flex; flex-direction: column; }
    .meta-col.right { align-items: flex-end; }
    .time-field { display: flex; align-items: center; gap: 6px; }
    .time-input {
        width: 56px; text-align: center;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 10px; color: var(--text-primary); font-size: 1rem; font-weight: 600;
        padding: 7px 8px; outline: none; transition: border-color 0.2s;
        -moz-appearance: textfield;
        appearance: textfield;
    }
    .time-input::-webkit-inner-spin-button,
    .time-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    .time-input:focus { border-color: var(--border-strong); background: var(--surface-hover); }
    .time-input::placeholder { color: var(--text-faint); }
    .time-unit { font-size: 0.85rem; color: rgba(255,255,255,0.45); font-weight: 600; }
</style>