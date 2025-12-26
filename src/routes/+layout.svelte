<script>
    import { page } from '$app/stores';
    import { Timer, ListTodo, BarChart3, Settings } from 'lucide-svelte';
</script>

<div class="app-shell">
    <nav>
        <div class="logo">ProjectHub</div>
        <div class="nav-links">
            <a href="/timer" class:active={$page.url.pathname === '/timer'}>
                <Timer size={20} /> Timer
            </a>
            <a href="/tasks" class:active={$page.url.pathname === '/tasks'}>
                <ListTodo size={20} /> Tasks
            </a>
            <a href="/stats" class:active={$page.url.pathname === '/stats'}>
                <BarChart3 size={20} /> Stats
            </a>
            <a href="/settings" class:active={$page.url.pathname === '/settings'}>
                <Settings size={20} />
            </a>
        </div>
    </nav>

    <main>
        <slot />
    </main>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family: sans-serif;
        background: linear-gradient(135deg, #ba4949 0%, #d65a5a 100%);
        color: white;
        height: 100vh;
        overflow: hidden;
    }

    .app-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    nav {
        display: flex;
        justify-content: space-between;
        padding: 20px 40px;
        align-items: center;
    }

    .nav-links {
        display: flex;
        gap: 15px;
        background: rgba(255, 255, 255, 0.15);
        padding: 5px;
        border-radius: 50px;
        backdrop-filter: blur(10px);
    }

    a {
        color: white;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 40px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        transition: 0.2s;
    }

    a.active {
        background: white;
        color: #ba4949;
        font-weight: bold;
    }

    main {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>