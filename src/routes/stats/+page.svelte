<script>
    import { history } from '$lib/stores/history';
    import StatsGrid from '$lib/components/StatsGrid.svelte';

    // Calculate Summary Data
    $: totalMinutes = $history.reduce((acc, item) => acc + item.duration, 0);
    $: totalSessions = $history.length;
    
    // Calculate "Today's" minutes
    $: todayMinutes = $history
        .filter(h => new Date(h.date).toDateString() === new Date().toDateString())
        .reduce((acc, h) => acc + h.duration, 0);
</script>

<div class="glass-panel wide">
    <div class="header">
        <h2>Statistics</h2>
        <span class="subtitle">Your Focus Journey</span>
    </div>

    <div class="stats-row">
        <div class="stat-card">
            <h3>{todayMinutes}m</h3>
            <small>Today</small>
        </div>
        <div class="stat-card">
            <h3>{totalMinutes}m</h3>
            <small>Total Focus</small>
        </div>
        <div class="stat-card">
            <h3>{totalSessions}</h3>
            <small>Sessions</small>
        </div>
    </div>

    <StatsGrid />

    <div class="history-list">
        <h3>Recent Sessions</h3>
        <ul>
            {#each $history.slice(0, 5) as item}
                <li>
                    <span>{item.taskTitle || 'No Task'}</span>
                    <span class="time">{new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </li>
            {/each}
        </ul>
    </div>
</div>

<style>
    .glass-panel {
        background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
        width: 100%; max-width: 600px; padding: 40px; border-radius: 24px;
        color: white; text-align: center;
    }
    .stats-row { display: flex; gap: 15px; margin: 30px 0; }
    .stat-card {
        background: rgba(0,0,0,0.2); flex: 1; padding: 15px; border-radius: 12px;
    }
    .stat-card h3 { font-size: 1.5rem; margin: 0; }
    .history-list { margin-top: 30px; text-align: left; }
    .history-list ul { list-style: none; padding: 0; }
    .history-list li {
        display: flex; justify-content: space-between;
        padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);
        font-size: 0.9rem; opacity: 0.9;
    }
</style>