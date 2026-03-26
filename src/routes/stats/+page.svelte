<script>
	import { tasks } from '$lib/stores/tasks';
	import { history } from '$lib/stores/history';

	import FocusWidget from '$lib/components/stats/FocusWidget.svelte';
	import TaskWidget from '$lib/components/stats/TaskWidget.svelte';
	import HistoryList from '$lib/components/stats/HistoryList.svelte';
	import Timeline from '$lib/components/stats/Timeline.svelte';
	import Heatmap from '$lib/components/stats/Heatmap.svelte';
	import RhythmChart from '$lib/components/stats/RhythmChart.svelte';
	import PriorityChart from '$lib/components/stats/PriorityChart.svelte';

	import { safeDate, getLocalDateStr, isSameDay } from '$lib/utils/statsUtils';

	let selectedDate = new Date();
	let mobileTab = 'overview';

	const changeDate = (days) => {
		const newD = new Date(selectedDate);
		newD.setDate(newD.getDate() + days);
		selectedDate = newD;
	};

	let stats = {
		todayFocus: 0,
		weekFocusHrs: 0,
		todayTasks: 0,
		activeTasks: 0,
		totalHours: 0,
		avgPomo: 25,
		totalArchived: 0
	};
	let weekData = [];
	let timelineSessions = [];
	let archiveList = [];
	let heatmapData = [];
	let rhythmData = [];
	let lineGraphData = [];
	let priorityPercents = { High: 0, Medium: 0, Low: 0 };
	let maxRhythmVal = 1;
	let maxTrendVal = 1;

	$: {
		const safeHistory = Array.isArray($history) ? $history : [];
		const safeTasks = Array.isArray($tasks) ? $tasks : [];
		const allArchived = safeTasks.filter((t) => t.status === 'archived');

		const currentDay = new Date(selectedDate);
		const weekStart = new Date(currentDay);
		weekStart.setDate(currentDay.getDate() - currentDay.getDay());
		weekStart.setHours(0, 0, 0, 0);

		const todaysSessions = safeHistory.filter((h) => isSameDay(safeDate(h.date), currentDay));
		const weekSessions = safeHistory.filter((h) => {
			const d = safeDate(h.date);
			return d && d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
		});

		const PIXELS_PER_HOUR = 80;
		timelineSessions = todaysSessions
			.map((session) => {
				const endD = safeDate(session.date);
				if (!endD) return null;
				const duration = session.duration || 25;
				const startD = session.startedAt
					? safeDate(session.startedAt)
					: new Date(endD.getTime() - duration * 60000);
				if (!startD) return null;
				const startMinutes = startD.getHours() * 60 + startD.getMinutes();
				const timeRange = `${startD.getHours()}:${startD.getMinutes().toString().padStart(2, '0')} - ${endD.getHours()}:${endD.getMinutes().toString().padStart(2, '0')}`;
				return {
					...session,
					top: (startMinutes / 60) * PIXELS_PER_HOUR,
					height: (duration / 60) * PIXELS_PER_HOUR,
					timeRange,
					label: session.taskTitle || 'Focus Session'
				};
			})
			.filter(Boolean);

		const historyMap = {};
		safeHistory.forEach((h) => {
			const d = safeDate(h.date);
			if (d) {
				const dateKey = getLocalDateStr(d);
				historyMap[dateKey] = (historyMap[dateKey] || 0) + (h.duration || 25);
			}
		});

		let tempHeatmap = [];
		const anchorDate = new Date();
		const startHeat = new Date(anchorDate);
		startHeat.setDate(anchorDate.getDate() - anchorDate.getDay() - 26 * 7);
		for (let w = 0; w < 53; w++) {
			let week = [];
			for (let d = 0; d < 7; d++) {
				const dateStr = getLocalDateStr(startHeat);
				const minutes = historyMap[dateStr] || 0;
				const isToday = isSameDay(startHeat, anchorDate);
				let intensity = 0;
				if (minutes > 0) intensity = 1;
				if (minutes >= 30) intensity = 2;
				if (minutes >= 60) intensity = 3;
				if (minutes >= 120) intensity = 4;
				week.push({ intensity, date: dateStr, minutes, isToday });
				startHeat.setDate(startHeat.getDate() + 1);
			}
			tempHeatmap.push(week);
		}
		heatmapData = tempHeatmap;

		let tempRhythm = [];
		let rMax = 0;
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const done = allArchived.filter((t) =>
				isSameDay(safeDate(t.completedAt || t.createdAt), d)
			).length;
			const mins = safeHistory
				.filter((h) => isSameDay(safeDate(h.date), d))
				.reduce((a, b) => a + (b.duration || 0), 0);
			const hrs = parseFloat((mins / 60).toFixed(1));
			const daySessions = safeHistory.filter((h) => isSameDay(safeDate(h.date), d));
			let avgH = 0;
			if (daySessions.length)
				avgH =
					daySessions.reduce((a, h) => a + new Date(h.date).getHours(), 0) / daySessions.length;
			tempRhythm.push({
				label: d.toLocaleDateString('en-US', { weekday: 'short' }),
				tasks: done,
				hours: hrs,
				time: avgH
			});
			rMax = Math.max(rMax, done, hrs);
		}
		rhythmData = tempRhythm;
		maxRhythmVal = rMax > 0 ? rMax : 5;

		let tempLine = [];
		let tMax = 0;
		let pCounts = { High: 0, Medium: 0, Low: 0 };
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const dailyTasks = allArchived.filter((t) => isSameDay(safeDate(t.completedAt), d));
			const counts = { High: 0, Medium: 0, Low: 0 };
			dailyTasks.forEach((t) => {
				const p =
					(t.priority || 'Medium').charAt(0).toUpperCase() +
					(t.priority || 'Medium').slice(1).toLowerCase();
				if (counts[p] !== undefined) {
					counts[p]++;
					pCounts[p]++;
				}
			});
			tempLine.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), ...counts });
			tMax = Math.max(tMax, counts.High, counts.Medium, counts.Low);
		}
		lineGraphData = tempLine;
		maxTrendVal = tMax > 0 ? tMax : 3;

		const totalP = pCounts.High + pCounts.Medium + pCounts.Low;
		priorityPercents = {
			High: totalP ? Math.round((pCounts.High / totalP) * 100) : 0,
			Medium: totalP ? Math.round((pCounts.Medium / totalP) * 100) : 0,
			Low: totalP ? Math.round((pCounts.Low / totalP) * 100) : 0
		};

		const totalMins = safeHistory.reduce((a, b) => a + (b.duration || 0), 0);
		stats = {
			todayFocus: todaysSessions.length,
			weekFocusHrs: (weekSessions.reduce((a, b) => a + (b.duration || 0), 0) / 60).toFixed(1),
			todayTasks: allArchived.filter((t) => isSameDay(safeDate(t.completedAt), currentDay)).length,
			activeTasks: safeTasks.filter((t) => t.status === 'inprogress').length,
			totalHours: (totalMins / 60).toFixed(0),
			avgPomo: safeHistory.length ? Math.round(totalMins / safeHistory.length) : 25,
			totalArchived: allArchived.length
		};

		weekData = Array(7)
			.fill(0)
			.map((_, i) => {
				const d = new Date(weekStart);
				d.setDate(d.getDate() + i);
				return {
					label: d.toLocaleDateString('en-US', { weekday: 'short' }),
					isToday: isSameDay(d, currentDay),
					val: weekSessions.filter((s) => isSameDay(safeDate(s.date), d)).length,
					tasks: allArchived.filter((t) => isSameDay(safeDate(t.completedAt), d)).length
				};
			});

		archiveList = allArchived.reverse().map((t) => ({
			...t,
			dateStr: safeDate(t.completedAt || t.createdAt)?.toLocaleDateString() || 'Unknown'
		}));
	}
</script>

<!-- ═══════════════════════════════════════════════
     DESKTOP layout (hidden on mobile)
════════════════════════════════════════════════ -->
<div class="desktop-page">
	<div class="dashboard-grid">
		<div class="column left-col">
			<FocusWidget {weekData} todayFocus={stats.todayFocus} weekFocusHrs={stats.weekFocusHrs} />
			<TaskWidget {weekData} todayTasks={stats.todayTasks} activeTasks={stats.activeTasks} />
			<HistoryList {archiveList} />
		</div>
		<div class="column mid-col">
			<Timeline {selectedDate} {timelineSessions} onChangeDate={changeDate} />
		</div>
		<div class="column right-col">
			<Heatmap {heatmapData} {stats} />
			<RhythmChart {rhythmData} {maxRhythmVal} />
			<PriorityChart {lineGraphData} {maxTrendVal} {priorityPercents} />
		</div>
	</div>
</div>

<!-- ═══════════════════════════════════════════════
     MOBILE layout (hidden on desktop)
════════════════════════════════════════════════ -->
<div class="mobile-page">
	<!-- Quick stats strip -->
	<div class="m-strip">
		<div class="m-stat">
			<span class="m-val">{stats.todayFocus}</span>
			<span class="m-lbl">Today</span>
		</div>
		<div class="m-sep"></div>
		<div class="m-stat">
			<span class="m-val">{stats.weekFocusHrs}h</span>
			<span class="m-lbl">Week</span>
		</div>
		<div class="m-sep"></div>
		<div class="m-stat">
			<span class="m-val">{stats.totalArchived}</span>
			<span class="m-lbl">Done</span>
		</div>
		<div class="m-sep"></div>
		<div class="m-stat">
			<span class="m-val">{stats.totalHours}h</span>
			<span class="m-lbl">Total</span>
		</div>
	</div>

	<!-- Tab bar -->
	<div class="m-tabs">
		<button
			class="m-tab"
			class:m-tab--active={mobileTab === 'overview'}
			on:click={() => (mobileTab = 'overview')}>Overview</button
		>
		<button
			class="m-tab"
			class:m-tab--active={mobileTab === 'timeline'}
			on:click={() => (mobileTab = 'timeline')}>Timeline</button
		>
		<button
			class="m-tab"
			class:m-tab--active={mobileTab === 'charts'}
			on:click={() => (mobileTab = 'charts')}>Charts</button
		>
		<button
			class="m-tab"
			class:m-tab--active={mobileTab === 'history'}
			on:click={() => (mobileTab = 'history')}>History</button
		>
	</div>

	<!-- Tab panels — rendered with {#if} so only one exists in the DOM at a time -->
	<div class="m-panel-wrap">
		{#if mobileTab === 'overview'}
			<div class="m-panel m-panel--scroll">
				<FocusWidget {weekData} todayFocus={stats.todayFocus} weekFocusHrs={stats.weekFocusHrs} />
				<TaskWidget {weekData} todayTasks={stats.todayTasks} activeTasks={stats.activeTasks} />
				<Heatmap {heatmapData} {stats} />
			</div>
		{:else if mobileTab === 'timeline'}
			<div class="m-panel m-panel--timeline">
				<Timeline {selectedDate} {timelineSessions} onChangeDate={changeDate} />
			</div>
		{:else if mobileTab === 'charts'}
			<div class="m-panel m-panel--scroll">
				<div class="m-chart-box">
					<RhythmChart {rhythmData} {maxRhythmVal} />
				</div>
				<div class="m-chart-box">
					<PriorityChart {lineGraphData} {maxTrendVal} {priorityPercents} />
				</div>
			</div>
		{:else if mobileTab === 'history'}
			<div class="m-panel m-panel--scroll">
				<HistoryList {archiveList} />
			</div>
		{/if}
	</div>
</div>

<style>
	/* ══════════════════════════════════════════
   DESKTOP
══════════════════════════════════════════ */
	.desktop-page {
		height: calc(100vh - 100px);
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		color: var(--text-primary);
		overflow: hidden;
		padding: 10px 0;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1.2fr 1.6fr 1.2fr;
		gap: 15px;
		flex: 1;
		min-height: 0;
		padding-bottom: 20px;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 15px;
		padding-right: 5px;
	}
	.left-col {
		overflow: hidden;
	}
	.mid-col {
		overflow-y: auto;
		scrollbar-width: none;
	}
	.mid-col::-webkit-scrollbar {
		display: none;
	}
	.right-col {
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	/* Mobile wrapper hidden on desktop */
	.mobile-page {
		display: none;
	}

	/* ══════════════════════════════════════════
   MOBILE
══════════════════════════════════════════ */
	@media (max-width: 768px) {
		/* Flip visibility */
		.desktop-page {
			display: none !important;
		}
		.mobile-page {
			display: flex;
			flex-direction: column;
			/* Full width of whatever the parent gives us */
			width: 100%;
			box-sizing: border-box;
			padding: 12px;
			gap: 10px;
			/* Scroll the whole page naturally */
			overflow-x: hidden;
		}

		/* ── Quick stats strip ── */
		.m-strip {
			display: flex;
			align-items: center;
			width: 100%;
			box-sizing: border-box;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 14px 0;
			flex-shrink: 0;
		}

		.m-stat {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 3px;
		}

		.m-val {
			font-size: 1.25rem;
			font-weight: 800;
			color: var(--text-primary);
			line-height: 1;
		}

		.m-lbl {
			font-size: 0.58rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.4px;
		}

		.m-sep {
			width: 1px;
			height: 28px;
			background: var(--border);
			flex-shrink: 0;
		}

		/* ── Tab bar ── */
		.m-tabs {
			display: flex;
			width: 100%;
			box-sizing: border-box;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 4px;
			gap: 2px;
			flex-shrink: 0;
		}

		.m-tab {
			flex: 1;
			background: transparent;
			border: none;
			color: var(--text-muted);
			padding: 9px 2px;
			border-radius: 10px;
			font-family: 'Poppins', sans-serif;
			font-size: 0.72rem;
			font-weight: 600;
			cursor: pointer;
			transition:
				background 0.15s,
				color 0.15s;
			white-space: nowrap;
		}

		.m-tab--active {
			background: var(--surface-hover);
			color: var(--text-primary);
		}

		/* ── Panel wrapper — gives every panel the same bounding box ── */
		.m-panel-wrap {
			width: 100%;
			box-sizing: border-box;
			/* Fixed height = viewport minus: strip~80 + tabs~50 + strip+top padding~34 + bottom nav 65 + gaps~20 */
			height: calc(100vh - 265px);
			min-height: 320px;
			flex-shrink: 0;
			/* Clip children — each panel fills this box */
			overflow: hidden;
			border-radius: 16px;
		}

		/* ── Base panel — fills the wrap ── */
		.m-panel {
			width: 100%;
			height: 100%;
			box-sizing: border-box;
		}

		/* Scrollable panel: stacks cards, scrolls vertically */
		.m-panel--scroll {
			overflow-y: auto;
			overflow-x: hidden;
			display: flex;
			flex-direction: column;
			gap: 10px;
			padding: 2px 2px 12px 2px;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}
		.m-panel--scroll::-webkit-scrollbar {
			display: none;
		}

		/* Timeline panel: no extra scroll wrapper — component handles its own */
		.m-panel--timeline {
			overflow: hidden;
		}

		/* ── Chart boxes inside the charts panel ── */
		.m-chart-box {
			/* Give each chart a concrete height so flex:1 inside them works */
			height: 210px;
			flex-shrink: 0;
			width: 100%;
			box-sizing: border-box;
			border-radius: 16px;
			overflow: hidden;
		}

		/* ── Force every direct child stat-box to full width ── */
		:global(.m-panel--scroll > .stat-box) {
			width: 100%;
			box-sizing: border-box;
			flex-shrink: 0;
		}

		/* Chart box: strip the component's own card chrome, let m-chart-box be the card */
		:global(.m-chart-box > .stat-box) {
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			box-shadow: var(--shadow);
		}

		/* Timeline: force full width + height so it fills m-panel--timeline */
		:global(.m-panel--timeline > .stat-box) {
			width: 100%;
			height: 100%;
			box-sizing: border-box;
		}

		/* Heatmap inner grid: keep it horizontally scrollable, never wider than the card */
		:global(.m-panel--scroll .heatmap-box) {
			width: 100%;
			box-sizing: border-box;
			overflow: hidden;
		}
		:global(.m-panel--scroll .heatmap-container) {
			overflow-x: auto;
			width: 100%;
		}
	}
</style>
