<script>
	import { tasks } from '$lib/stores/tasks';
	import { history } from '$lib/stores/history';

	// Components
	import FocusWidget from '$lib/components/stats/FocusWidget.svelte';
	import TaskWidget from '$lib/components/stats/TaskWidget.svelte';
	import HistoryList from '$lib/components/stats/HistoryList.svelte';
	import Timeline from '$lib/components/stats/Timeline.svelte';
	import Heatmap from '$lib/components/stats/Heatmap.svelte';
	import RhythmChart from '$lib/components/stats/RhythmChart.svelte';
	import PriorityChart from '$lib/components/stats/PriorityChart.svelte';

	// Utilities
	import { safeDate, getLocalDateStr, isSameDay } from '$lib/utils/statsUtils';

	// --- DATE NAVIGATION ---
	let selectedDate = new Date();
	let mobileStatsTab = 'overview';
	const changeDate = (days) => {
		const newD = new Date(selectedDate);
		newD.setDate(newD.getDate() + days);
		selectedDate = newD;
	};

	// --- DATA PROCESSING ---
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
		weekStart.setDate(currentDay.getDate() - currentDay.getDay()); // Start on Sunday
		weekStart.setHours(0, 0, 0, 0);

		const todaysSessions = safeHistory.filter((h) => isSameDay(safeDate(h.date), currentDay));
		const weekSessions = safeHistory.filter((h) => {
			const d = safeDate(h.date);
			return d && d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
		});

		// 1. TIMELINE DATA
		const PIXELS_PER_HOUR = 80;
		timelineSessions = todaysSessions
			.map((session) => {
				const endD = safeDate(session.date);
				if (!endD) return null;
				const duration = session.duration || 25;
				// Use recorded startedAt if available; fall back to computing from end - duration
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

		// 2. HEATMAP DATA
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
		const dayOfWeek = anchorDate.getDay();
		const startHeat = new Date(anchorDate);
		startHeat.setDate(anchorDate.getDate() - dayOfWeek - 26 * 7);

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

		// 3. RHYTHM & TRENDS
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

		// 4. PRIORITY LINE GRAPH
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

		// 5. STATS SUMMARY & WEEK DATA
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

<div class="page-container">
	<!-- DESKTOP: full 3-col grid -->
	<div class="dashboard-grid desktop-only">
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

	<!-- MOBILE: summary + tabs + panels all inside page-container -->
	<div class="mobile-root">
		<!-- Summary strip -->
		<div class="mobile-summary">
			<div class="summary-pill">
				<span class="summary-val">{stats.todayFocus}</span>
				<span class="summary-lbl">Today</span>
			</div>
			<div class="summary-divider"></div>
			<div class="summary-pill">
				<span class="summary-val">{stats.weekFocusHrs}h</span>
				<span class="summary-lbl">Week</span>
			</div>
			<div class="summary-divider"></div>
			<div class="summary-pill">
				<span class="summary-val">{stats.totalArchived}</span>
				<span class="summary-lbl">Done</span>
			</div>
			<div class="summary-divider"></div>
			<div class="summary-pill">
				<span class="summary-val">{stats.totalHours}h</span>
				<span class="summary-lbl">Total</span>
			</div>
		</div>

		<!-- Tab switcher -->
		<div class="mobile-tabs">
			<button
				class="mobile-tab"
				class:active={mobileStatsTab === 'overview'}
				on:click={() => (mobileStatsTab = 'overview')}>Overview</button
			>
			<button
				class="mobile-tab"
				class:active={mobileStatsTab === 'timeline'}
				on:click={() => (mobileStatsTab = 'timeline')}>Timeline</button
			>
			<button
				class="mobile-tab"
				class:active={mobileStatsTab === 'charts'}
				on:click={() => (mobileStatsTab = 'charts')}>Charts</button
			>
			<button
				class="mobile-tab"
				class:active={mobileStatsTab === 'history'}
				on:click={() => (mobileStatsTab = 'history')}>History</button
			>
		</div>

		<!-- Tab content — all panels are the same fixed height, scroll internally -->
		<div class="mobile-panel" class:hidden={mobileStatsTab !== 'overview'}>
			<div class="panel-scroll">
				<FocusWidget {weekData} todayFocus={stats.todayFocus} weekFocusHrs={stats.weekFocusHrs} />
				<TaskWidget {weekData} todayTasks={stats.todayTasks} activeTasks={stats.activeTasks} />
				<Heatmap {heatmapData} {stats} />
			</div>
		</div>

		<div class="mobile-panel" class:hidden={mobileStatsTab !== 'timeline'}>
			<div class="panel-scroll panel-scroll--timeline">
				<Timeline {selectedDate} {timelineSessions} onChangeDate={changeDate} />
			</div>
		</div>

		<div class="mobile-panel" class:hidden={mobileStatsTab !== 'charts'}>
			<div class="panel-scroll">
				<div class="chart-card">
					<RhythmChart {rhythmData} {maxRhythmVal} />
				</div>
				<div class="chart-card">
					<PriorityChart {lineGraphData} {maxTrendVal} {priorityPercents} />
				</div>
			</div>
		</div>

		<div class="mobile-panel" class:hidden={mobileStatsTab !== 'history'}>
			<div class="panel-scroll">
				<HistoryList {archiveList} />
			</div>
		</div>
	</div>
</div>

<style>
	/* ── DESKTOP LAYOUT ── */
	.page-container {
		height: calc(100vh - 100px);
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		color: var(--text-primary);
		overflow: hidden;
		padding: 10px 0;
	}

	/* Mobile root hidden on desktop */
	.mobile-root {
		display: none;
	}

	.desktop-only {
		display: grid;
	}

	.dashboard-grid {
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

	/* ── MOBILE BREAKPOINT ── */
	@media (max-width: 768px) {
		/* Shrink the outer container to just a wrapper */
		.page-container {
			height: auto;
			overflow: visible;
			padding: 0;
		}

		/* Hide the desktop 3-col grid */
		.desktop-only {
			display: none !important;
		}

		/* Show the mobile root */
		.mobile-root {
			display: flex;
			flex-direction: column;
			gap: 10px;
			padding: 12px 12px 24px 12px;
			box-sizing: border-box;
			/* Allow the page to scroll naturally */
			overflow: visible;
		}

		/* ── Summary strip ── */
		.mobile-summary {
			display: flex;
			align-items: center;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 14px 8px;
			gap: 0;
			flex-shrink: 0;
		}

		.summary-pill {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 3px;
		}

		.summary-val {
			font-size: 1.3rem;
			font-weight: 800;
			color: var(--text-primary);
			line-height: 1;
		}

		.summary-lbl {
			font-size: 0.58rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.summary-divider {
			width: 1px;
			height: 30px;
			background: var(--border);
			flex-shrink: 0;
		}

		/* ── Tab switcher ── */
		.mobile-tabs {
			display: flex;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 4px;
			gap: 2px;
			flex-shrink: 0;
		}

		.mobile-tab {
			flex: 1;
			background: transparent;
			border: none;
			color: var(--text-muted);
			padding: 9px 4px;
			border-radius: 10px;
			font-family: 'Poppins', sans-serif;
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			transition: 0.2s;
			white-space: nowrap;
		}

		.mobile-tab.active {
			background: var(--surface-hover);
			color: var(--text-primary);
		}

		/* ── Tab panels ── */

		/* Every panel occupies the exact same fixed height */
		.mobile-panel {
			/* summary ~80px + tabs ~50px + gap ~32px + bottom nav 65px + breathing room */
			height: calc(100vh - 260px);
			min-height: 340px;
			flex-shrink: 0;
		}

		/* Hidden panels are removed from layout but keep their size reserved */
		.mobile-panel.hidden {
			display: none;
		}

		/* Inner scroll wrapper — fills the panel, scrolls its own content */
		.panel-scroll {
			height: 100%;
			overflow-y: auto;
			overflow-x: hidden;
			display: flex;
			flex-direction: column;
			gap: 12px;
			scrollbar-width: none;
			-ms-overflow-style: none;
			padding-bottom: 8px;
			box-sizing: border-box;
		}

		.panel-scroll::-webkit-scrollbar {
			display: none;
		}

		/* Timeline gets its own scroll behaviour — the component handles it internally */
		.panel-scroll--timeline {
			overflow: hidden;
			gap: 0;
		}

		:global(.panel-scroll--timeline .stat-box) {
			height: 100%;
			flex: 1;
		}

		/* Chart cards give the flex:1 chart components a real explicit height */
		.chart-card {
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 16px;
			height: 200px;
			flex-shrink: 0;
			display: flex;
			flex-direction: column;
			box-shadow: var(--shadow);
		}

		/* Reset the chart component's own stat-box so it fills the card cleanly */
		:global(.chart-card .stat-box) {
			background: transparent;
			border: none;
			border-radius: 0;
			padding: 0;
			box-shadow: none;
			flex: 1;
			min-height: 0;
		}

		/* ── Width fixes ── */

		/* Every panel and its direct stat-box children must be full width */
		.mobile-panel,
		.panel-scroll {
			width: 100%;
			box-sizing: border-box;
		}

		:global(.mobile-panel .stat-box),
		:global(.panel-scroll .stat-box) {
			width: 100%;
			box-sizing: border-box;
			min-width: 0;
		}

		/* Timeline: force full width on the box and its inner scroll */
		:global(.panel-scroll--timeline .stat-box),
		:global(.panel-scroll--timeline .timeline-box) {
			width: 100%;
			box-sizing: border-box;
		}

		/* Heatmap: the grid is min-width:max-content (53 weeks), clip it to the box */
		:global(.panel-scroll .heatmap-container) {
			width: 100%;
			overflow-x: auto;
			box-sizing: border-box;
		}

		:global(.panel-scroll .heatmap-grid) {
			min-width: unset;
			width: max-content;
		}

		/* Prevent any chart SVG from blowing out its container */
		:global(.panel-scroll svg) {
			max-width: 100%;
		}
	}
</style>
