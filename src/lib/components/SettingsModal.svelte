<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { X, User, Moon, Bell, Volume2, LogOut, Check } from 'lucide-svelte';
    import { settings } from '$lib/stores/settings'; // Assuming you have this
    
    // Mock User Data (Replace with your actual user store later)
    export let user = {
        name: "Focus User",
        email: "user@example.com",
        plan: "Free Plan"
    };

    const dispatch = createEventDispatcher();

    // Local state for the form
    let theme = $settings.theme || 'dark';
    let soundEnabled = $settings.soundEnabled ?? true;
    let notifications = $settings.notifications ?? true;
    let volume = $settings.volume || 75;

    function saveSettings() {
        settings.update(s => ({
            ...s,
            theme,
            soundEnabled,
            notifications,
            volume
        }));
        dispatch('close');
    }

    function handleSignOut() {
        if(confirm("Log out of your account?")) {
            console.log("Signing out...");
            // Add your auth logout logic here
            dispatch('close');
        }
    }
</script>

<div class="modal-backdrop" on:click|self={() => dispatch('close')} transition:fade={{ duration: 200 }}>
    <div class="modal-glass" transition:scale={{ start: 0.95, duration: 200 }}>
        
        <div class="modal-header">
            <h2>Settings</h2>
            <button class="close-btn" on:click={() => dispatch('close')}>
                <X size={24} />
            </button>
        </div>

        <div class="section profile-section">
            <div class="avatar">
                {user.name.charAt(0)}
            </div>
            <div class="user-info">
                <h3>{user.name}</h3>
                <span class="email">{user.email}</span>
                <span class="badge">{user.plan}</span>
            </div>
            <button class="btn-outline">Edit</button>
        </div>

        <div class="divider"></div>

        <div class="section">
            <div class="label"><Moon size={16} /> Appearance</div>
            <div class="theme-grid">
                {#each ['dark', 'light', 'midnight', 'forest'] as t}
                    <button 
                        class="theme-btn {t}" 
                        class:active={theme === t}
                        on:click={() => theme = t}
                    >
                        {#if theme === t}<Check size={14} />{/if}
                        <span class="theme-name">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                    </button>
                {/each}
            </div>
        </div>

        <div class="section">
            <div class="label"><Bell size={16} /> Notifications</div>
            
            <div class="toggle-row">
                <span>Browser Notifications</span>
                <button 
                    class="toggle-switch" 
                    class:checked={notifications} 
                    on:click={() => notifications = !notifications}
                >
                    <div class="knob"></div>
                </button>
            </div>

            <div class="toggle-row">
                <div class="vol-label">
                    <span>Sound Effects</span>
                    <Volume2 size={14} opacity={0.6} />
                </div>
                <button 
                    class="toggle-switch" 
                    class:checked={soundEnabled} 
                    on:click={() => soundEnabled = !soundEnabled}
                >
                    <div class="knob"></div>
                </button>
            </div>

            {#if soundEnabled}
                <div class="volume-slider" transition:scale>
                    <input type="range" min="0" max="100" bind:value={volume} />
                </div>
            {/if}
        </div>

        <div class="modal-footer">
            <button class="btn-signout" on:click={handleSignOut}>
                <LogOut size={16} /> Sign Out
            </button>
            <button class="btn-save" on:click={saveSettings}>
                Done
            </button>
        </div>

    </div>
</div>

<style>
    /* SHARED MODAL STYLES */
    .modal-backdrop {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
        display: flex; justify-content: center; align-items: center; padding: 20px;
    }

    .modal-glass {
        width: 100%; max-width: 500px;
        background: rgba(30, 30, 30, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px; padding: 30px;
        box-shadow: 0 40px 80px rgba(0,0,0,0.6);
        color: white; font-family: sans-serif;
        display: flex; flex-direction: column; gap: 20px;
    }

    /* HEADER */
    .modal-header { display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.5rem; }
    .close-btn { background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; border-radius: 50%; padding: 5px; transition: 0.2s; }
    .close-btn:hover { background: rgba(255,255,255,0.1); color: white; }

    /* PROFILE */
    .profile-section { display: flex; align-items: center; gap: 15px; }
    .avatar { width: 50px; height: 50px; background: #ba4949; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700; color: white; }
    .user-info { flex: 1; display: flex; flex-direction: column; }
    .user-info h3 { margin: 0; font-size: 1rem; }
    .email { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
    .badge { font-size: 0.7rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 4px; }
    
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; transition: 0.2s; }
    .btn-outline:hover { background: rgba(255,255,255,0.05); border-color: white; }

    .divider { height: 1px; background: rgba(255,255,255,0.1); margin: 5px 0; }

    /* SECTIONS */
    .section { display: flex; flex-direction: column; gap: 12px; }
    .label { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.5); font-weight: 700; display: flex; align-items: center; gap: 8px; }

    /* THEME GRID */
    .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .theme-btn {
        background: rgba(0,0,0,0.2); border: 1px solid transparent; color: rgba(255,255,255,0.6);
        padding: 10px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px;
        transition: 0.2s;
    }
    .theme-btn.active { background: rgba(255,255,255,0.1); border-color: #ba4949; color: white; }
    .theme-btn:hover:not(.active) { background: rgba(255,255,255,0.05); }

    /* TOGGLES */
    .toggle-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; }
    .vol-label { display: flex; align-items: center; gap: 8px; }
    
    .toggle-switch {
        width: 44px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 20px;
        position: relative; cursor: pointer; border: none; transition: 0.3s;
    }
    .toggle-switch .knob {
        width: 18px; height: 18px; background: white; border-radius: 50%;
        position: absolute; top: 3px; left: 3px; transition: 0.3s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .toggle-switch.checked { background: #4caf50; }
    .toggle-switch.checked .knob { transform: translateX(20px); }

    .volume-slider input { width: 100%; accent-color: #ba4949; height: 4px; margin-top: 10px; }

    /* FOOTER */
    .modal-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    
    .btn-signout {
        display: flex; align-items: center; gap: 8px; background: transparent; border: none;
        color: #ff7675; cursor: pointer; font-size: 0.9rem; font-weight: 600; padding: 10px; border-radius: 8px; transition: 0.2s;
    }
    .btn-signout:hover { background: rgba(255, 118, 117, 0.1); }

    .btn-save {
        background: white; color: #ba4949; border: none; padding: 10px 24px; border-radius: 10px;
        font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: 0.2s;
    }
    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.3); }
</style>