<script>
    import { settings } from '$lib/stores/settings';
    import { X } from 'lucide-svelte';
    export let onClose;

    // Local state to hold values before saving
    let tempSettings = { ...$settings };

    function save() {
        settings.set(tempSettings);
        onClose();
    }
</script>

<div class="modal-backdrop" on:click={onClose}>
    <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
            <h2>Settings</h2>
            <button class="close-btn" on:click={onClose}><X size={20} /></button>
        </div>

        <div class="setting-group">
            <h3>Timer (minutes)</h3>
            <div class="inputs-row">
                <div class="input-item">
                    <label>Pomodoro</label>
                    <input type="number" bind:value={tempSettings.pomodoro} min="1" />
                </div>
                <div class="input-item">
                    <label>Short Break</label>
                    <input type="number" bind:value={tempSettings.shortBreak} min="1" />
                </div>
                <div class="input-item">
                    <label>Long Break</label>
                    <input type="number" bind:value={tempSettings.longBreak} min="1" />
                </div>
            </div>
        </div>

        <div class="setting-group">
            <h3>Cycle</h3>
            <div class="input-item full-width">
                <label>Long Break Interval (sessions)</label>
                <input type="number" bind:value={tempSettings.longBreakInterval} min="1" />
                <p class="help-text">Number of Pomodoros before a long break.</p>
            </div>
        </div>

        <button class="save-btn" on:click={save}>Save Changes</button>
    </div>
</div>

<style>
    /* Add this to your existing styles */
    .full-width { width: 100%; }
    .help-text { font-size: 0.8rem; color: #888; margin-top: 5px; }
    
    /* ... existing styles for modal ... */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 2000; display: flex; justify-content: center; align-items: center; }
    .modal-content { background: #1e1e1e; color: white; padding: 30px; border-radius: 20px; width: 400px; max-width: 90%; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; color: #888; cursor: pointer; }
    .close-btn:hover { color: white; }
    .setting-group { margin-bottom: 25px; }
    .setting-group h3 { font-size: 0.9rem; text-transform: uppercase; color: #888; margin-bottom: 15px; letter-spacing: 1px; }
    .inputs-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
    .input-item label { display: block; font-size: 0.8rem; margin-bottom: 5px; opacity: 0.8; }
    .input-item input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px; border-radius: 8px; font-size: 1rem; }
    .save-btn { width: 100%; background: #ba4949; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 1rem; }
    .save-btn:hover { background: #a13636; }
</style>