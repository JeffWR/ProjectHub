<script>
	import { page } from '$app/stores';
	import { Timer, ListTodo, BarChart3, Hexagon, User } from 'lucide-svelte';
	import Toast from '$lib/components/Toast.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import SyncStatus from '$lib/components/SyncStatus.svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import { loadTasks } from '$lib/stores/tasks';
	import { settings } from '$lib/stores/settings';
	import { themes } from '$lib/themes';
	import { addToast } from '$lib/stores/toast';

	let showSettings = false;

	// Prevent hydration flash for user icon
	let hydrated = false;
	onMount(() => {
		hydrated = true;

		// Position the nav indicator once the DOM is ready (bind:this
		// populates navLinks after the first render, so we need one tick)
		setTimeout(recalcIndicator, 0);

		// --- STALE TAB SOFT REFRESH ---
		// If the tab was backgrounded for more than 10 minutes, re-fetch data
		// when it becomes visible again — without a full page reload (no flash).
		// invalidateAll() re-runs SvelteKit load functions; loadTasks() syncs
		// the task store from the cloud. Svelte's reactivity handles the diff.
		const STALE_THRESHOLD = 10 * 60 * 1000;
		let hiddenAt = null;

		const onVisibility = async () => {
			if (document.visibilityState === 'hidden') {
				hiddenAt = Date.now();
			} else if (document.visibilityState === 'visible' && hiddenAt) {
				if (Date.now() - hiddenAt > STALE_THRESHOLD) {
					addToast('Refreshing data…', 'info');
					await invalidateAll();
					if ($user) loadTasks();
				}
				hiddenAt = null;
			}
		};
		document.addEventListener('visibilitychange', onVisibility);

		// --- RESIZE: recalc nav indicator when viewport changes ---
		// (e.g. switching monitors with different DPR/resolution)
		window.addEventListener('resize', recalcIndicator);

		return () => {
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('resize', recalcIndicator);
		};
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

	function recalcIndicator() {
		const activeLink = navLinks[$page.url.pathname];
		if (activeLink) {
			const rect = activeLink.getBoundingClientRect();
			const parentRect = activeLink.parentElement.getBoundingClientRect();
			indicatorStyle = `left: ${rect.left - parentRect.left}px; width: ${rect.width}px;`;
		}
	}

	// Re-run whenever the route changes
	$: ($page.url.pathname, recalcIndicator());
</script>

<Toast />

{#if showSettings}
	<SettingsModal on:close={() => (showSettings = false)} />
{/if}

<div class="app-shell">
	<!-- Desktop top nav -->
	<nav class="top-nav">
		<div class="nav-left">
			<div class="logo-icon">
				<Hexagon size={28} strokeWidth={2.5} />
			</div>
			<span class="brand-name">ProjectHub</span>
		</div>

		<div class="nav-center">
			<div class="nav-links-wrapper">
				{#if indicatorStyle}<div class="nav-indicator" style={indicatorStyle}></div>{/if}
				<a
					href="/tasks"
					class:active={$page.url.pathname === '/tasks'}
					bind:this={navLinks['/tasks']}
				>
					<ListTodo size={18} /> Tasks
				</a>
				<a
					href="/timer"
					class:active={$page.url.pathname === '/timer'}
					bind:this={navLinks['/timer']}
				>
					<Timer size={18} /> Timer
				</a>
				<a
					href="/stats"
					class:active={$page.url.pathname === '/stats'}
					bind:this={navLinks['/stats']}
				>
					<BarChart3 size={18} /> Stats
				</a>
			</div>
		</div>

		<div class="nav-sync">
			<SyncStatus />
		</div>

		<div class="nav-right">
			<button
				class="profile-btn"
				on:click={() => (showSettings = true)}
				style="opacity: {hydrated ? 1 : 0}; transition: opacity 0.5s ease-out"
			>
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

	<!-- Mobile bottom nav -->
	<nav class="bottom-nav">
		<a href="/tasks" class:active={$page.url.pathname === '/tasks'}>
			<ListTodo size={22} />
			<span>Tasks</span>
		</a>
		<a href="/timer" class:active={$page.url.pathname === '/timer'}>
			<Timer size={22} />
			<span>Timer</span>
		</a>
		<a href="/stats" class:active={$page.url.pathname === '/stats'}>
			<BarChart3 size={22} />
			<span>Stats</span>
		</a>
		<button
			class="bottom-nav-btn"
			on:click={() => (showSettings = true)}
			style="opacity: {hydrated ? 1 : 0}; transition: opacity 0.5s ease-out"
		>
			{#if $user && $user.email}
				<div class="avatar-circle-sm">{$user.email[0].toUpperCase()}</div>
			{:else}
				<User size={22} />
			{/if}
			<span>Profile</span>
		</button>
	</nav>
</div>

<style>
	/* CSS VARIABLE DEFAULTS (pomodoro theme — overridden by JS on load) */
	:global(:root) {
		--bg-gradient: linear-gradient(135deg, #ba4949 0%, #d65a5a 100%);
		--color-primary: #ba4949;
		--color-primary-2: #d65a5a;
		--text-primary: #ffffff;
		--text-secondary: rgba(255, 255, 255, 0.7);
		--text-muted: rgba(255, 255, 255, 0.5);
		--text-faint: rgba(255, 255, 255, 0.4);
		--surface: rgba(255, 255, 255, 0.1);
		--surface-hover: rgba(255, 255, 255, 0.15);
		--surface-modal: rgba(30, 30, 30, 0.95);
		--border: rgba(255, 255, 255, 0.1);
		--border-strong: rgba(255, 255, 255, 0.2);
		--input-bg: rgba(0, 0, 0, 0.2);
	}

	:global(body) {
		margin: 0;
		font-family: 'Poppins', sans-serif;
		background: var(--bg-gradient);
		color: var(--text-primary);
		height: 100vh;
		/* overflow: hidden is fine on desktop only — mobile overrides below */
		overflow: hidden;
	}

	.app-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	/* ── TOP NAV (desktop) ── */
	.top-nav {
		height: 80px;
		padding: 0 40px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
		flex-shrink: 0;
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: 12px;
		z-index: 10;
	}
	.logo-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.brand-name {
		font-weight: 700;
		font-size: 1.5rem;
		letter-spacing: -0.5px;
	}

	.nav-center {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		background: var(--surface-hover);
		padding: 6px;
		border-radius: 50px;
		backdrop-filter: blur(10px);
		border: 1px solid var(--border);
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
		border: 1px solid var(--border-strong);
		border-radius: 40px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 0;
	}

	a {
		color: var(--text-secondary);
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

	a:hover {
		color: var(--text-primary);
	}

	a.active {
		color: var(--color-primary);
		font-weight: 600;
	}

	.nav-sync {
		position: absolute;
		right: 180px;
		z-index: 10;
	}

	.nav-right {
		z-index: 10;
	}

	.profile-btn {
		background: var(--surface);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
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
		background: var(--surface-hover);
		border-color: var(--border-strong);
	}

	.user-name {
		font-size: 0.9rem;
	}

	.avatar-circle {
		width: 32px;
		height: 32px;
		background: white;
		color: var(--color-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
	}

	main {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 0;
		/* overflow: hidden only on desktop — mobile overrides to visible */
		overflow: hidden;
	}

	/* ── BOTTOM NAV (mobile only) ── */
	.bottom-nav {
		display: none;
	}

	/* ── MOBILE BREAKPOINT ── */
	@media (max-width: 768px) {
		:global(body) {
			/* Never lock body scroll on mobile — it traps content below the fold */
			overflow-x: hidden;
			overflow-y: auto;
			height: auto;
		}

		.top-nav {
			display: none;
		}

		main {
			/* Leave room for bottom nav — let content scroll naturally with the page */
			padding-bottom: 65px;
			align-items: flex-start;
			overflow: visible;
			height: auto;
			min-height: 0;
		}

		.bottom-nav {
			display: flex;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 65px;
			background: var(--surface-modal);
			border-top: 1px solid var(--border-strong);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			z-index: 100;
			padding-bottom: env(safe-area-inset-bottom);
		}

		.bottom-nav a,
		.bottom-nav-btn {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 3px;
			color: var(--text-muted);
			text-decoration: none;
			font-size: 0.65rem;
			font-weight: 600;
			letter-spacing: 0.3px;
			background: none;
			border: none;
			cursor: pointer;
			font-family: 'Poppins', sans-serif;
			padding: 0;
			transition: color 0.2s ease;
		}

		.bottom-nav a.active {
			color: var(--text-primary);
			border-radius: 0;
			padding: 0;
		}

		.bottom-nav a:hover,
		.bottom-nav-btn:hover {
			color: var(--text-primary);
		}

		.avatar-circle-sm {
			width: 24px;
			height: 24px;
			background: white;
			color: var(--color-primary);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			font-size: 0.75rem;
		}
	}
</style>
