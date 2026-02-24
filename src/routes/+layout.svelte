<script>
    import { page } from '$app/stores';
    import { Timer, ListTodo, BarChart3, Hexagon, User } from 'lucide-svelte';
    import Toast from '$lib/components/Toast.svelte';
    import SettingsModal from '$lib/components/SettingsModal.svelte';
    import SyncStatus from '$lib/components/SyncStatus.svelte';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { user } from '$lib/stores/auth';
    import { loadTasks } from '$lib/stores/tasks';
    import { settings } from '$lib/stores/settings';
    import { themes } from '$lib/themes';

    let showSettings = false;

    // Prevent hydration flash for user icon
    let hydrated = false;
    onMount(() => {
        hydrated = true;
    });

    // --- NEW REACTIVE LOGIC ---
    // When the user logs in, immediately pull their tasks from the cloud.
    $: if ($user) {
        loadTasks();
    }
    // --------------------------

    // --- THEME APPLICATION ---
    // Runs whenever settings.theme changes. Sets CSS custom properties on <html>
    // so every component can consume them via var(--...).
    $: if (browser) {
        const t = themes[$settings.theme] ?? themes.pomodoro;
        Object.entries(t).forEach(([key, val]) => {
            document.documentElement.style.setProperty(key, val);
        });
    }

    // --- SLIDING INDICATOR LOGIC ---
    let navLinks = {};
    let indicatorStyle = '';

    $: {
        const path = $page.url.pathname;
        const activeLink = navLinks[path];
        if (activeLink) {
            const rect = activeLink.getBoundingClientRect();
            const parentRect = activeLink.parentElement.getBoundingClientRect();
            const left = rect.left - parentRect.left;
            indicatorStyle = `left: ${left}px; width: ${rect.width}px;`;
        }
    }
</script>

<Toast />

{#if showSettings}
    <SettingsModal on:close={() => showSettings = false} />
{/if}

<div class="app-shell">
    <nav>
        <div class="nav-left">
            <div class="logo-icon">
                <Hexagon size={28} strokeWidth={2.5} />
            </div>
            <span class="brand-name">ProjectHub</span>
        </div>

        <div class="nav-center">
            <div class="nav-links-wrapper">
                <div class="nav-indicator" style={indicatorStyle}></div>
                <a href="/tasks" class:active={$page.url.pathname === '/tasks'} bind:this={navLinks['/tasks']}>
                    <ListTodo size={18} /> Tasks
                </a>
                <a href="/timer" class:active={$page.url.pathname === '/timer'} bind:this={navLinks['/timer']}>
                    <Timer size={18} /> Timer
                </a>
                <a href="/stats" class:active={$page.url.pathname === '/stats'} bind:this={navLinks['/stats']}>
                    <BarChart3 size={18} /> Stats
                </a>
            </div>
        </div>

        <div class="nav-sync">
            <SyncStatus />
        </div>

        <div class="nav-right">
            <button class="profile-btn" on:click={() => showSettings = true} style="opacity: {hydrated ? 1 : 0}; transition: opacity 0.5s ease-out">
                {#if $user && $user.email}
                    <span class="user-name">{$user.email.split('@')[0]}</span>
                    <div class="avatar-circle">
                        {$user.email[0].toUpperCase()}
                    </div>
                {:else}
                    <span class="user-name">Focus User</span>
                    <div class="avatar-circle">
                        <User size={18} />
                    </div>
                {/if}
            </button>
        </div>
    </nav>

    <main>
        <slot />
    </main>
</div>

<style>
    /* CSS VARIABLE DEFAULTS (pomodoro theme — overridden by JS on load) */
    :global(:root) {
        --bg-gradient:    linear-gradient(135deg, #ba4949 0%, #d65a5a 100%);
        --color-primary:  #ba4949;
        --color-primary-2:#d65a5a;
        --text-primary:   #ffffff;
        --text-secondary: rgba(255,255,255,0.7);
        --text-muted:     rgba(255,255,255,0.5);
        --text-faint:     rgba(255,255,255,0.4);
        --surface:        rgba(255,255,255,0.1);
        --surface-hover:  rgba(255,255,255,0.15);
        --surface-modal:  rgba(30,30,30,0.95);
        --border:         rgba(255,255,255,0.1);
        --border-strong:  rgba(255,255,255,0.2);
        --input-bg:       rgba(0,0,0,0.2);
    }

    :global(body) {
        margin: 0;
        font-family: 'Poppins', sans-serif;
        background: var(--bg-gradient);
        color: var(--text-primary);
        height: 100vh;
        overflow: hidden;
    }

    .app-shell { display: flex; flex-direction: column; height: 100%; }

    nav {
        height: 80px;
        padding: 0 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
    }

    .nav-left { display: flex; align-items: center; gap: 12px; z-index: 10; }
    .logo-icon { display: flex; align-items: center; justify-content: center; }
    .brand-name { font-weight: 700; font-size: 1.5rem; letter-spacing: -0.5px; }

    .nav-center {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.15);
        padding: 6px;
        border-radius: 50px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-links-wrapper {
        position: relative;
        display: flex;
        gap: 8px;
    }

    .nav-indicator {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        height: 44px;
        background: white;
        border-radius: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 0;
    }

    a {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        padding: 10px 24px;
        border-radius: 40px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        transition: color 0.2s ease;
        position: relative;
        z-index: 1;
    }

    a:hover { color: white; }

    a.active {
        color: #ba4949;
        font-weight: 600;
    }

    .nav-sync {
        position: absolute;
        right: 180px;
        z-index: 10;
    }

    .nav-right { z-index: 10; }

    .profile-btn {
        background: rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 6px 6px 6px 16px; 
        border-radius: 30px;
        cursor: pointer;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: 0.2s;
    }
    
    .profile-btn:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.4);
    }

    .user-name { font-size: 0.9rem; }

    .avatar-circle {
        width: 32px; height: 32px;
        background: white; color: #ba4949;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; /* Added so the initial letter looks bold */
    }

    main {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>