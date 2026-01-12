<script>
    import { page } from '$app/stores';
    import { Timer, ListTodo, BarChart3, Settings, LogIn, Hexagon } from 'lucide-svelte';
    import { injectAnalytics } from '@vercel/analytics/sveltekit'
    import Toast from '$lib/components/Toast.svelte'; // Import the notification system
</script>

<Toast />

<div class="app-shell">
    <nav>
        <div class="nav-left">
            <div class="logo-icon">
                <Hexagon size={28} strokeWidth={2.5} />
            </div>
            <span class="brand-name">ProjectHub</span>
        </div>

        <div class="nav-center">
            <a href="/tasks" class:active={$page.url.pathname === '/tasks'}>
                <ListTodo size={18} /> Tasks
            </a>
            <a href="/timer" class:active={$page.url.pathname === '/timer'}>
                <Timer size={18} /> Timer
            </a>
            <a href="/stats" class:active={$page.url.pathname === '/stats'}>
                <BarChart3 size={18} /> Stats
            </a>
            <a href="/settings" class:active={$page.url.pathname === '/settings'}>
                <Settings size={18} /> Settings
            </a>
        </div>

        <div class="nav-right">
            <button class="login-btn">
                <span>Log In</span>
                <LogIn size={18} />
            </button>
        </div>
    </nav>

    <main>
        <slot />
    </main>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family: 'Poppins', sans-serif; /* Applied new font */
        background: linear-gradient(135deg, #ba4949 0%, #d65a5a 100%);
        color: white;
        height: 100vh;
        overflow: hidden;
    }

    .app-shell { display: flex; flex-direction: column; height: 100%; }

    nav {
        height: 80px;
        padding: 0 40px;
        display: flex;
        align-items: center;
        justify-content: space-between; /* Pushes Left/Right to edges */
        position: relative; /* Needed for absolute centering */
    }

    /* LEFT SECTION */
    .nav-left {
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10; /* Ensure it sits above anything else */
    }
    .logo-icon {
        display: flex; align-items: center; justify-content: center;
    }
    .brand-name {
        font-weight: 700;
        font-size: 1.5rem;
        letter-spacing: -0.5px;
    }

    /* CENTER SECTION (Absolute Centering) */
    .nav-center {
        position: absolute;
        left: 50%;
        transform: translateX(-50%); /* Moves it back by 50% of its own width */
        display: flex;
        gap: 8px;
        background: rgba(255, 255, 255, 0.15);
        padding: 6px;
        border-radius: 50px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
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
        transition: all 0.2s ease;
    }

    a:hover { background: rgba(255, 255, 255, 0.1); color: white; }
    
    a.active {
        background: white;
        color: #ba4949;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    /* RIGHT SECTION */
    .nav-right {
        z-index: 10;
    }
    .login-btn {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.4);
        color: white;
        padding: 10px 20px;
        border-radius: 30px;
        cursor: pointer;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: 0.2s;
    }
    .login-btn:hover {
        background: white;
        color: #ba4949;
        border-color: white;
    }

    main {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>