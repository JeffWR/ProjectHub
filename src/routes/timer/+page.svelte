<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { timer } from '$lib/stores/timer';
	import { tasks, heroTask } from '$lib/stores/tasks';
	import { settings } from '$lib/stores/settings';
	import { history } from '$lib/stores/history';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	import { send, receive, growWithGradient } from '$lib/components/ui/transitions.js';

	function immerse(node, { duration = 850 } = {}) {
		return {
			duration,
			css: (t) => {
				const e = cubicOut(t);
				return `
                    opacity: ${e};
                    transform: scale(${1.05 - 0.05 * e});
                `;
			}
		};
	}

	function emerge(node, { duration = 500 } = {}) {
		return {
			duration,
			css: (t) => {
				const e = cubicOut(t);
				// t goes 1→0 on exit, so invert it
				return `
                    opacity: ${e};
                    transform: scale(${1.0 + 0.05 * (1 - e)});
                `;
			}
		};
	}
	import { handleTimerCompletion, advancePhase, applyMode } from '$lib/components/timer/TimerLogic';

	import TimerCompleteModal from '$lib/components/TimerCompleteModal.svelte';
	import TimeEditor from '$lib/components/timer/TimeEditor.svelte';

	// Prevent hydration flash: only show values once client hydrates
	let hydrated = false;
	onMount(() => {
		hydrated = true;
	});

	// --- DISPLAY LOGIC ---
	$: minutes = Math.floor($timer.timeLeft / 60);
	$: seconds = $timer.timeLeft % 60;
	$: displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	$: activeTask = $heroTask;

	// Debug: Log timer state changes
	$: {
		console.log(
			`[Timer Page] Reactive update - mode: ${$timer.mode}, timeLeft: ${$timer.timeLeft}, displayTime: ${displayTime}`
		);
	}

	const isToday = (dateStr) => {
		const d = new Date(dateStr);
		const today = new Date();
		return d.toDateString() === today.toDateString();
	};
	$: completedToday = $history ? $history.filter((h) => isToday(h.date)).length : 0;

	// --- TIMER COMPLETION LOGIC ---
	let previousTime = -1;
	let processingCompletion = false;
	let showCompleteModal = false;

	$: {
		if (previousTime > 0 && $timer.timeLeft === 0 && !processingCompletion) {
			onTimerComplete();
		}
		previousTime = $timer.timeLeft;
	}

	async function onTimerComplete() {
		processingCompletion = true;
		const result = await handleTimerCompletion($heroTask, completedToday);
		if (result.shouldShowModal) {
			showCompleteModal = true;
		} else {
			setTimeout(() => {
				processingCompletion = false;
			}, 100);
		}
	}

	async function takeBreak() {
		showCompleteModal = false;
		await advancePhase(completedToday);
		setTimeout(() => {
			processingCompletion = false;
		}, 100);
	}

	async function skipBreak() {
		showCompleteModal = false;
		applyMode('pomodoro');
		setTimeout(() => {
			processingCompletion = false;
		}, 100);
	}

	// --- EDITING LOGIC ---
	let isEditing = false;
	let editStartMinutes = 25;

	function startEditing() {
		if ($timer.isRunning) return;
		// Calculate where the ruler should start (current timer duration in mins)
		editStartMinutes = Math.floor($timer.timeLeft / 60) || 1;
		isEditing = true;
	}

	// --- HOLD TO QUIT LOGIC ---
	let isHolding = false;
	let holdProgress = 0;
	let holdFrame;
	let holdStartTime;
	const HOLD_DURATION = 2000;
	const RADIUS = 240;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	$: strokeDashoffset = CIRCUMFERENCE - (holdProgress / 100) * CIRCUMFERENCE;

	function startHold(e) {
		if (!$timer.isRunning) return;
		if (e && e.cancelable) e.preventDefault();
		isHolding = true;
		holdStartTime = Date.now();
		function loop() {
			if (!isHolding) return;
			const elapsed = Date.now() - holdStartTime;
			holdProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
			if (elapsed >= HOLD_DURATION) {
				timer.reset();
				cancelHold();
			} else {
				holdFrame = requestAnimationFrame(loop);
			}
		}
		holdFrame = requestAnimationFrame(loop);
	}
	function cancelHold() {
		isHolding = false;
		holdProgress = 0;
		if (holdFrame) cancelAnimationFrame(holdFrame);
	}
</script>

{#if hydrated}
	<div
		class="glass-panel"
		class:dimmed={isEditing || showCompleteModal}
		class:running={$timer.isRunning && $timer.mode !== 'pomodoro'}
		on:mousedown={$timer.isRunning && $timer.mode !== 'pomodoro' ? startHold : null}
		on:mouseup={cancelHold}
		on:mouseleave={cancelHold}
		on:touchstart={$timer.isRunning && $timer.mode !== 'pomodoro' ? startHold : null}
		on:touchend={cancelHold}
		on:contextmenu|preventDefault
		in:fly={{ y: 20, duration: 400 }}
	>
		{#if $timer.isRunning && $timer.mode !== 'pomodoro'}
			<!-- ── BREAK RUNNING: dashboard view with countdown ── -->
			<div class="panel-state" in:fade={{ duration: 350, delay: 200 }} out:fade={{ duration: 200 }}>
				<div class="task-pill">
					<span class="break-dot">●</span> On break
				</div>

				<h1 class="timer-digits dashboard-timer">{displayTime}</h1>

				<div class="hold-bar-track" style="opacity: {isHolding ? 1 : 0}">
					<div class="hold-bar-fill" style="width: {holdProgress}%"></div>
				</div>

				<div class="instruction">
					{#if isHolding}
						<span class="text-danger">Keep holding to stop...</span>
					{:else}
						<span class="text-muted">Hold to Stop</span>
					{/if}
				</div>
			</div>
		{:else}
			<!-- ── STOPPED: full dashboard ── -->
			<div class="panel-state" in:fade={{ duration: 350, delay: 200 }} out:fade={{ duration: 200 }}>
				<div class="task-pill">
					{#if activeTask}
						<span class="active-dot">●</span> Working on:
						<strong class="task-title">{activeTask.title}</strong>
					{:else}
						<span class="inactive">Drag a task to "In Focus" to start</span>
					{/if}
				</div>

				{#if !isEditing}
					<h1 class="timer-digits dashboard-timer" on:click={startEditing} title="Click to edit">
						{displayTime}
					</h1>
				{:else}
					<div style="height: 7rem; margin: 10px 0 30px 0;"></div>
				{/if}

				<div class="controls">
					<button class="btn-main" on:click={timer.start}>START</button>
				</div>

				<div class="modes">
					<button on:click={() => applyMode('pomodoro')} class:active={$timer.mode === 'pomodoro'}
						>Pomodoro</button
					>
					<button on:click={() => applyMode('short')} class:active={$timer.mode === 'short'}
						>Short Break</button
					>
					<button on:click={() => applyMode('long')} class:active={$timer.mode === 'long'}
						>Long Break</button
					>
				</div>

				<div class="cycle-info">
					Session {(completedToday % ($settings?.longBreakInterval || 4)) + 1} of {$settings?.longBreakInterval ||
						4}
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- ── POMODORO FOCUS OVERLAY (covers entire screen including nav) ── -->
{#if hydrated && $timer.isRunning && $timer.mode === 'pomodoro'}
	<div
		class="focus-overlay"
		class:shaking={isHolding && holdProgress > 85}
		on:mousedown={startHold}
		on:mouseup={cancelHold}
		on:mouseleave={cancelHold}
		on:touchstart|preventDefault={startHold}
		on:touchend={cancelHold}
		on:contextmenu|preventDefault
		in:immerse
		out:emerge
	>
		<!-- Hold-to-stop ring: absolute, centered, large enough to surround the timer text -->
		<svg class="hold-ring" viewBox="0 0 500 500" aria-hidden="true">
			<circle
				stroke="rgba(255,255,255,0.07)"
				stroke-width="2"
				fill="transparent"
				r={RADIUS}
				cx="250"
				cy="250"
			/>
			<circle
				stroke="#ff4757"
				stroke-width="2.5"
				fill="transparent"
				r={RADIUS}
				cx="250"
				cy="250"
				stroke-dasharray={CIRCUMFERENCE}
				stroke-dashoffset={strokeDashoffset}
				class="hold-ring__fill"
				style="opacity: {isHolding ? 1 : 0}"
			/>
		</svg>

		<div class="focus-inner" in:fly={{ y: 28, duration: 700, delay: 380 }}>
			<div class="focus-label">
				{#if activeTask}
					<span>{activeTask.title}</span>
				{:else}
					Focus Mode
				{/if}
			</div>

			<div class="focus-time">{displayTime}</div>

			<div class="focus-hint">
				{#if isHolding}
					<span class="text-danger">Keep holding to stop...</span>
				{:else}
					Hold anywhere to stop
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if isEditing}
	<TimeEditor initialMinutes={editStartMinutes} on:close={() => (isEditing = false)} />
{/if}

{#if showCompleteModal}
	<TimerCompleteModal on:takeBreak={takeBreak} on:skipBreak={skipBreak} />
{/if}

<style>
	/* --- GLASS PANEL (DASHBOARD) --- */
	.glass-panel {
		position: relative;
		background: var(--surface);
		backdrop-filter: blur(12px);
		border: 1px solid var(--border);
		border-radius: 30px;
		width: 100%;
		max-width: 600px;
		aspect-ratio: 4/3;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		box-shadow: var(--shadow);
		transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
		opacity: 1 !important;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		:global(main) {
			align-items: center !important;
			justify-content: center !important;
			min-height: calc(100vh - 65px) !important;
			padding: 16px 16px 81px 16px !important;
		}

		.glass-panel {
			width: 100%;
			max-width: 420px;
			aspect-ratio: auto;
			min-height: 380px;
			border-radius: 24px;
			margin: 0 auto;
		}
	}

	.glass-panel.dimmed {
		pointer-events: none;
		transform: scale(0.98);
	}

	.glass-panel.running {
		cursor: pointer;
		gap: 20px;
	}

	.panel-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	/* --- TYPOGRAPHY --- */
	.timer-digits {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'tnum';
		user-select: none;
		letter-spacing: -2px;
	}
	.dashboard-timer {
		font-size: 7rem;
		margin: 10px 0 30px 0;
		cursor: pointer;
	}
	.dashboard-timer:hover {
		transform: scale(1.02);
	}

	@media (max-width: 768px) {
		.dashboard-timer {
			font-size: 5rem;
			margin: 8px 0 20px 0;
		}
	}

	.hold-bar-track {
		width: 200px;
		height: 3px;
		background: rgba(255, 255, 255, 0.12);
		border-radius: 99px;
		overflow: hidden;
		margin-bottom: 8px;
		transition: opacity 0.2s ease;
	}

	.hold-bar-fill {
		height: 100%;
		background: #ff4757;
		border-radius: 99px;
		transition: width 0.05s linear;
	}

	.instruction {
		height: 24px;
		font-size: 0.8rem;
		letter-spacing: 2px;
		text-transform: uppercase;
		font-weight: 700;
		pointer-events: none;
		opacity: 0.5;
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.task-pill {
			font-size: 0.78rem;
			padding: 6px 12px;
			max-width: 85%;
		}
		.task-title {
			max-width: 200px;
		}
		.controls {
			margin-bottom: 20px;
		}
		.btn-main {
			padding: 12px 32px;
			font-size: 1rem;
		}
		.modes {
			gap: 6px;
		}
		.modes button {
			padding: 6px 10px;
			font-size: 0.78rem;
		}
		.cycle-info {
			margin-top: 12px;
			font-size: 0.75rem;
		}
	}
	.text-danger {
		color: #ff4757;
		animation: pulse 1s infinite;
		opacity: 1;
	}

	/* --- UTILS --- */
	.task-pill {
		background: var(--surface);
		border: 1px solid var(--border);
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-bottom: 20px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		max-width: 90%;
	}
	.task-title {
		display: inline-block;
		max-width: 350px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: bottom;
	}
	.active-dot {
		color: #4caf50;
		font-size: 0.8rem;
	}
	.break-dot {
		color: #3b9ede;
		font-size: 0.8rem;
	}
	.inactive {
		opacity: 0.6;
		font-style: italic;
	}

	.controls {
		display: flex;
		gap: 15px;
		margin-bottom: 40px;
	}

	.btn-main {
		background: var(--text-primary);
		color: var(--color-primary);
		border: none;
		padding: 15px 40px;
		font-size: 1.2rem;
		border-radius: 12px;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 4px 0 rgba(0, 0, 0, 0.15);
		transition: transform 0.1s;
	}

	.modes {
		display: flex;
		gap: 10px;
		background: var(--surface);
		border: 1px solid var(--border);
		padding: 5px;
		border-radius: 12px;
	}
	.modes button {
		background: transparent;
		border: none;
		color: var(--text-muted);
		padding: 8px 16px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: 0.2s;
	}
	.modes button.active {
		background: var(--surface-hover);
		color: var(--text-primary);
	}
	.cycle-info {
		margin-top: 20px;
		font-size: 0.85rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	@keyframes pulse {
		0% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.6;
		}
	}
	@keyframes shake {
		10%,
		90% {
			transform: translate3d(-1px, 0, 0);
		}
		20%,
		80% {
			transform: translate3d(2px, 0, 0);
		}
		30%,
		50%,
		70% {
			transform: translate3d(-4px, 0, 0);
		}
		40%,
		60% {
			transform: translate3d(4px, 0, 0);
		}
	}

	/* --- FULL-SCREEN FOCUS OVERLAY --- */
	.focus-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		/* Fully opaque base + layered pattern */
		background-color: #080404;
		background-image:
            /* Warm radial glow centred on the timer */
			radial-gradient(ellipse 60% 55% at 50% 50%, rgba(160, 50, 50, 0.18) 0%, transparent 70%),
			/* Subtle dot grid */ radial-gradient(circle, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
		background-size:
			100% 100%,
			26px 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		user-select: none;
		transform-origin: center;
	}

	.focus-overlay.shaking .focus-time {
		animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
		color: #ff4757;
	}

	/* Ring: absolute, centered, 500×500 so r=240 puts it well outside the digits */
	.hold-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 600px;
		height: 600px;
		transform: translate(-50%, -50%) rotate(-90deg);
		pointer-events: none;
	}

	.hold-ring__fill {
		transition:
			stroke-dashoffset 0.05s linear,
			opacity 0.3s ease;
		stroke-linecap: round;
	}

	.focus-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 28px;
		position: relative; /* sits above the ring in stacking order */
	}

	.focus-label {
		font-size: 1.1rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.5px;
		max-width: 420px;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.focus-time {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		font-weight: 800;
		font-size: 9rem;
		color: #ffffff;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'tnum';
		letter-spacing: -5px;
		pointer-events: none;
	}

	@media (max-width: 768px) {
		.focus-time {
			font-size: 5.5rem;
			letter-spacing: -3px;
		}
		.focus-label {
			font-size: 0.9rem;
			max-width: 90vw;
		}
		.hold-ring {
			width: 340px;
			height: 340px;
		}
		.focus-inner {
			gap: 18px;
		}
	}

	.focus-hint {
		font-size: 0.7rem;
		letter-spacing: 3px;
		text-transform: uppercase;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.25);
		pointer-events: none;
	}
</style>
