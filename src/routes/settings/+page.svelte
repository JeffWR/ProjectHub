<script>
    import { 
        User, CreditCard, Clock, Settings, 
        MessageSquare, Bell, Moon, Smartphone,
        LogOut, ChevronRight, Check, Minus, Plus, X
    } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';

    // UI State
    let activeTab = 'timer'; 
    let feedbackSent = false;
    let feedbackText = "";

    // Mock Data / Settings Store
    let settings = {
        // Timer Defaults
        pomodoroLen: 25,
        shortBreak: 5,
        longBreak: 15,
        autoStartBreaks: false,
        autoStartPomos: false,
        longBreakInterval: 4,
        
        // General
        theme: 'dark',
        startOfWeek: 'monday',
        soundVolume: 75,
        notifications: true,
        
        // Account
        username: "FocusUser",
        email: "user@example.com",
        plan: "free" 
    };

    // Helper for the custom number steppers
    function adjustVal(key, amount, min, max) {
        const newVal = settings[key] + amount;
        if (newVal >= min && newVal <= max) {
            settings[key] = newVal;
        }
    }

    function handleFeedback() {
        if(!feedbackText) return;
        feedbackSent = true;
        feedbackText = "";
        setTimeout(() => feedbackSent = false, 3000);
    }
</script>

<div class="modal-backdrop">
    <div class="settings-layout" in:fly={{ y: 20, duration: 400 }}>

        <nav class="settings-sidebar">
            
            <div class="nav-group">
                <button class:active={activeTab === 'timer'} on:click={() => activeTab = 'timer'}>
                    <Clock size={18} /> Timer
                </button>
                
                <button class:active={activeTab === 'general'} on:click={() => activeTab = 'general'}>
                    <Settings size={18} /> General
                </button>
    
                <button class:active={activeTab === 'account'} on:click={() => activeTab = 'account'}>
                    <User size={18} /> Account
                </button>
            </div>
    
            <div class="nav-footer">
                <button class:active={activeTab === 'support'} on:click={() => activeTab = 'support'}>
                    <MessageSquare size={18} /> Support
                </button>
                <span class="ver">v1.2.0</span>
            </div>
        </nav>
    
        <main class="settings-content">
            
            {#if activeTab === 'timer'}
                <div in:fade={{ duration: 250 }} class="tab-pane">
                    <header class="pane-header">
                        <h3>Timer Configuration</h3>
                        <p>Fine-tune your focus intervals.</p>
                    </header>
                    
                    <div class="grid-2-col">
                        <div class="setting-card">
                            <label>Pomodoro</label>
                            <div class="stepper">
                                <button on:click={() => adjustVal('pomodoroLen', -1, 1, 60)}><Minus size={14}/></button>
                                <span class="val">{settings.pomodoroLen}</span>
                                <span class="unit">min</span>
                                <button on:click={() => adjustVal('pomodoroLen', 1, 1, 60)}><Plus size={14}/></button>
                            </div>
                        </div>
                        
                        <div class="setting-card">
                            <label>Short Break</label>
                            <div class="stepper">
                                <button on:click={() => adjustVal('shortBreak', -1, 1, 30)}><Minus size={14}/></button>
                                <span class="val">{settings.shortBreak}</span>
                                <span class="unit">min</span>
                                <button on:click={() => adjustVal('shortBreak', 1, 1, 30)}><Plus size={14}/></button>
                            </div>
                        </div>
                        
                        <div class="setting-card">
                            <label>Long Break</label>
                            <div class="stepper">
                                <button on:click={() => adjustVal('longBreak', -1, 1, 60)}><Minus size={14}/></button>
                                <span class="val">{settings.longBreak}</span>
                                <span class="unit">min</span>
                                <button on:click={() => adjustVal('longBreak', 1, 1, 60)}><Plus size={14}/></button>
                            </div>
                        </div>
    
                        <div class="setting-card">
                            <label>Intervals</label>
                            <div class="stepper">
                                <button on:click={() => adjustVal('longBreakInterval', -1, 2, 10)}><Minus size={14}/></button>
                                <span class="val">{settings.longBreakInterval}</span>
                                <span class="unit">x</span>
                                <button on:click={() => adjustVal('longBreakInterval', 1, 2, 10)}><Plus size={14}/></button>
                            </div>
                        </div>
                    </div>
    
                    <div class="toggles-container">
                        <div class="toggle-row">
                            <div class="label-group">
                                <label>Auto-start Breaks</label>
                                <span class="subtext">Timer starts automatically when work ends</span>
                            </div>
                            <button class="toggle-switch" class:checked={settings.autoStartBreaks} on:click={() => settings.autoStartBreaks = !settings.autoStartBreaks}>
                                <div class="knob"></div>
                            </button>
                        </div>
        
                        <div class="toggle-row">
                            <div class="label-group">
                                <label>Auto-start Pomodoros</label>
                                <span class="subtext">Timer starts automatically when break ends</span>
                            </div>
                            <button class="toggle-switch" class:checked={settings.autoStartPomos} on:click={() => settings.autoStartPomos = !settings.autoStartPomos}>
                                <div class="knob"></div>
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
    
            {#if activeTab === 'general'}
                <div in:fade={{ duration: 250 }} class="tab-pane">
                    <header class="pane-header">
                        <h3>Preferences</h3>
                        <p>Customize the app experience.</p>
                    </header>
    
                    <div class="settings-list">
                        <div class="list-item">
                            <div class="label-group">
                                <label>Color Theme</label>
                                <span class="subtext">Select the visual style</span>
                            </div>
                            <div class="select-wrapper">
                                <select bind:value={settings.theme}>
                                    <option value="dark">Focus Dark</option>
                                    <option value="red">Pomodoro Red</option>
                                    <option value="blue">Deep Blue</option>
                                    <option value="amoled">Midnight</option>
                                </select>
                            </div>
                        </div>
        
                        <div class="list-item">
                            <label>Start of Week</label>
                            <div class="select-wrapper">
                                <select bind:value={settings.startOfWeek}>
                                    <option value="monday">Monday</option>
                                    <option value="sunday">Sunday</option>
                                    <option value="saturday">Saturday</option>
                                </select>
                            </div>
                        </div>
        
                        <div class="list-item volume-block">
                            <div class="vol-header">
                                <label><Bell size={16}/> Sound Volume</label>
                                <span class="vol-val">{settings.soundVolume}%</span>
                            </div>
                            <div class="range-wrap">
                                <input type="range" min="0" max="100" bind:value={settings.soundVolume}>
                                <div class="range-fill" style="width: {settings.soundVolume}%"></div>
                            </div>
                        </div>
                        
                        <div class="list-item">
                            <div class="label-group">
                                <label>Browser Notifications</label>
                            </div>
                            <button class="toggle-switch" class:checked={settings.notifications} on:click={() => settings.notifications = !settings.notifications}>
                                <div class="knob"></div>
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
    
            {#if activeTab === 'account'}
                <div in:fade={{ duration: 250 }} class="tab-pane">
                    <header class="pane-header">
                        <h3>Account</h3>
                    </header>
                    
                    <div class="account-card">
                        <div class="avatar">{settings.username.charAt(0)}</div>
                        <div class="acc-details">
                            <span class="u-name">{settings.username}</span>
                            <span class="u-email">{settings.email}</span>
                        </div>
                        <button class="btn-text">Edit</button>
                    </div>
    
                    <div class="plan-card" class:pro={settings.plan === 'pro'}>
                        <div class="plan-content">
                            <div class="plan-icon">
                                {#if settings.plan === 'pro'}
                                    <CreditCard size={20} />
                                {:else}
                                    <User size={20} />
                                {/if}
                            </div>
                            <div class="plan-info">
                                <span class="plan-label">Current Plan</span>
                                <span class="plan-name">{settings.plan === 'pro' ? 'Pro Membership' : 'Free Tier'}</span>
                            </div>
                        </div>
                        {#if settings.plan === 'free'}
                            <button class="btn-upgrade">Upgrade</button>
                        {:else}
                            <button class="btn-outline">Manage</button>
                        {/if}
                    </div>
    
                    <div class="spacer"></div>
    
                    <button class="btn-signout">
                        <LogOut size={18} /> <span>Sign Out</span>
                    </button>
                </div>
            {/if}
    
            {#if activeTab === 'support'}
                <div in:fade={{ duration: 250 }} class="tab-pane">
                    <header class="pane-header">
                        <h3>Help & Feedback</h3>
                        <p>Found a bug? Have a request?</p>
                    </header>
                    
                    <div class="feedback-form">
                        <textarea 
                            placeholder="Tell us what you think..." 
                            bind:value={feedbackText}
                        ></textarea>
                        
                        <div class="form-footer">
                            <button class="btn-primary" on:click={handleFeedback} disabled={!feedbackText || feedbackSent}>
                                {#if feedbackSent}
                                    <Check size={18} /> Sent!
                                {:else}
                                    Send Feedback
                                {/if}
                            </button>
                        </div>
                    </div>
    
                    <div class="links-grid">
                        <a href="#" class="link-card">
                            <span>Documentation</span>
                            <ChevronRight size={16} />
                        </a>
                        <a href="#" class="link-card">
                            <span>Privacy Policy</span>
                            <ChevronRight size={16} />
                        </a>
                    </div>
                </div>
            {/if}
    
        </main>
    </div>
</div>

<style>
    /* --- VARIABLES --- */
    :root {
        --glass-bg: rgba(20, 20, 20, 0.75);
        --glass-border: rgba(255, 255, 255, 0.08);
        --nav-bg: rgba(0, 0, 0, 0.2);
        --accent: #ff7675;
        --accent-hover: #e17055;
        --text-main: #ffffff;
        --text-muted: rgba(255, 255, 255, 0.5);
        --card-bg: rgba(255, 255, 255, 0.03);
        --card-hover: rgba(255, 255, 255, 0.06);
    }

    /* --- LAYOUT --- */
    /* Center the modal, allow scaling */
    .modal-backdrop {
        display: flex; justify-content: center; align-items: center;
        width: 100%; height: 100%; /* offset from top nav */
    }

    .settings-layout {
        display: flex;
        /* SCALING FIX: Use viewport units */
        width: 95%; max-width: 1400px;
        height: 75vh; min-height: 600px;
        
        background: var(--glass-bg);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        
        border: 1px solid var(--glass-border);
        border-radius: 24px;
        box-shadow: 0 2px 2px rgba(0,0,0,0.5);
        color: var(--text-main);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        position: relative;
        overflow: hidden;
    }
    /* --- SIDEBAR --- */
    .settings-sidebar {
        width: 240px; flex-shrink: 0;
        background: var(--nav-bg);
        padding: 30px 20px;
        display: flex; flex-direction: column;
        border-right: 1px solid var(--glass-border);
    }
    .sidebar-header h2 { font-size: 1.4rem; margin: 0 0 30px 10px; font-weight: 700; opacity: 0.9; }
    
    .nav-group { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    
    .settings-sidebar button {
        background: transparent; border: none; color: var(--text-muted);
        padding: 12px 16px; text-align: left; border-radius: 12px;
        cursor: pointer; display: flex; align-items: center; gap: 12px;
        font-weight: 500; font-size: 0.95rem; transition: 0.2s;
    }
    .settings-sidebar button:hover { background: rgba(255,255,255,0.05); color: white; }
    .settings-sidebar button.active { background: rgba(255,255,255,0.1); color: white; font-weight: 600; box-shadow: inset 3px 0 0 var(--accent); }
    
    .nav-footer { margin-top: auto; display: flex; flex-direction: column; gap: 10px; padding-top: 20px; border-top: 1px solid var(--glass-border); }
    .ver { font-size: 0.75rem; color: var(--text-muted); padding-left: 16px; opacity: 0.5; }

    /* --- CONTENT AREA --- */
    .settings-content { flex: 1; padding: 50px; overflow-y: auto; position: relative; }
    
    .pane-header { margin-bottom: 30px; border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; }
    .pane-header h3 { margin: 0; font-size: 1.8rem; font-weight: 700; }
    .pane-header p { margin: 5px 0 0; color: var(--text-muted); font-size: 0.95rem; }

    /* --- COMPONENT: GRID & CARDS --- */
    .grid-2-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    
    .setting-card {
        background: var(--card-bg); padding: 20px; border-radius: 16px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        border: 1px solid transparent; transition: 0.2s;
    }
    .setting-card:hover { border-color: var(--glass-border); background: var(--card-hover); }
    .setting-card label { margin-bottom: 12px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 700; }

    /* --- COMPONENT: STEPPER --- */
    .stepper { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 30px; }
    .stepper button {
        background: rgba(255,255,255,0.1); border: none; color: white;
        width: 32px; height: 32px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: 0.2s;
    }
    .stepper button:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
    .stepper .val { font-size: 1.4rem; font-weight: 700; min-width: 35px; text-align: center; }
    .stepper .unit { font-size: 0.75rem; color: var(--text-muted); margin-left: -8px; margin-top: 6px; }

    /* --- COMPONENT: TOGGLES --- */
    .toggles-container, .settings-list { display: flex; flex-direction: column; gap: 10px; }
    .toggle-row, .list-item { 
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px; border-radius: 12px; background: transparent; transition: 0.2s;
    }
    .toggle-row:hover, .list-item:hover { background: var(--card-bg); }

    .label-group { display: flex; flex-direction: column; gap: 4px; }
    .label-group label { font-size: 1rem; font-weight: 500; }
    .subtext { font-size: 0.85rem; color: var(--text-muted); }

    .toggle-switch {
        width: 50px; height: 28px; background: rgba(255,255,255,0.1);
        border-radius: 30px; position: relative; cursor: pointer; border: none; transition: 0.3s;
    }
    .toggle-switch .knob {
        width: 22px; height: 22px; background: white; border-radius: 50%;
        position: absolute; top: 3px; left: 3px; transition: 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .toggle-switch.checked { background: var(--accent); }
    .toggle-switch.checked .knob { transform: translateX(22px); }

    /* --- COMPONENT: DROPDOWN --- */
    .select-wrapper select {
        appearance: none; background: var(--card-bg); border: 1px solid var(--glass-border);
        color: white; padding: 10px 36px 10px 16px; border-radius: 10px;
        font-size: 0.95rem; cursor: pointer;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat; background-position: right 10px center; background-size: 16px;
    }

    /* --- COMPONENT: SLIDER --- */
    .volume-block { flex-direction: column; align-items: stretch; gap: 15px; background: var(--card-bg); border-radius: 16px; border: 1px solid var(--glass-border); }
    .vol-header { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
    .vol-header label { display: flex; gap: 8px; align-items: center; }
    
    .range-wrap { position: relative; width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; }
    .range-wrap input { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; margin: 0; }
    .range-wrap .range-fill { height: 100%; background: var(--accent); border-radius: 3px; pointer-events: none; transition: width 0.1s; }
    /* Thumb Styling */
    .range-wrap input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); cursor: pointer; }

    /* --- ACCOUNT --- */
    .account-card {
        display: flex; align-items: center; gap: 15px; padding: 20px;
        background: var(--card-bg); border-radius: 16px; margin-bottom: 20px;
        border: 1px solid var(--glass-border);
    }
    .avatar { width: 48px; height: 48px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.4rem; color: white; }
    .acc-details { flex: 1; display: flex; flex-direction: column; }
    .u-name { font-weight: 700; font-size: 1.1rem; }
    .u-email { font-size: 0.85rem; color: var(--text-muted); }
    .btn-text { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem; text-decoration: underline; }

    .plan-card {
        background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
        border: 1px solid var(--glass-border); padding: 20px; border-radius: 16px;
        display: flex; justify-content: space-between; align-items: center;
    }
    .plan-content { display: flex; gap: 15px; align-items: center; }
    .plan-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--accent); }
    .plan-info { display: flex; flex-direction: column; }
    .plan-label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
    .plan-name { font-size: 1.1rem; font-weight: 700; }
    
    .btn-upgrade { background: white; color: black; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-upgrade:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255,255,255,0.2); }
    .btn-outline { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
    .btn-outline:hover { background: rgba(255,255,255,0.05); }

    .btn-signout {
        width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
        background: rgba(255, 71, 87, 0.15); color: #ff6b81; border: none; padding: 14px;
        border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: 0.2s;
    }
    .btn-signout:hover { background: rgba(255, 71, 87, 0.25); }
    
    .spacer { height: 20px; border-bottom: 1px solid var(--glass-border); margin-bottom: 20px; }

    /* --- SUPPORT --- */
    .feedback-form textarea {
        width: 100%; height: 140px; background: var(--card-bg); border: 1px solid var(--glass-border);
        border-radius: 12px; padding: 15px; color: white; font-family: inherit; resize: none; margin-bottom: 15px;
        font-size: 1rem;
    }
    .feedback-form textarea:focus { outline: none; border-color: var(--accent); background: rgba(0,0,0,0.2); }
    
    .btn-primary {
        background: var(--accent); color: white; border: none; padding: 12px 24px; border-radius: 10px;
        font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-left: auto;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }

    .links-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px; }
    .link-card { 
        display: flex; justify-content: space-between; align-items: center;
        background: var(--card-bg); padding: 15px; border-radius: 12px;
        text-decoration: none; color: var(--text-muted); transition: 0.2s; border: 1px solid transparent;
    }
    .link-card:hover { border-color: var(--glass-border); color: white; background: var(--card-hover); }
</style>