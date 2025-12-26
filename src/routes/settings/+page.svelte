<div class="glass-panel">
    <h2>Settings</h2>
    
    <div class="setting-group">
        <label>Theme</label>
        <select>
            <option>Pomodoro Red</option>
            <option>Deep Blue</option>
            <option>Dark Mode</option>
        </select>
    </div>

    <div class="setting-group">
        <label>Notification Sound</label>
        <input type="range" min="0" max="100" />
    </div>

    <div class="info-box">
        <p><strong>Project Hub v1.0</strong></p>
        <p>Modular SvelteKit Architecture</p>
    </div>
</div>

<style>
    .glass-panel {
        background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
        padding: 40px; border-radius: 20px; width: 100%; max-width: 400px;
        text-align: left;
    }
    .setting-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: bold; }
    select, input { width: 100%; padding: 10px; border-radius: 6px; border: none; }
    .info-box { 
        margin-top: 40px; padding-top: 20px; 
        border-top: 1px solid rgba(255,255,255,0.2); 
        text-align: center; opacity: 0.7; font-size: 0.8rem;
    }
</style>