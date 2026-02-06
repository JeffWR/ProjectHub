<script>
    export let weekData = [];
    export let todayTasks = 0;
    export let activeTasks = 0;
</script>

<div class="stat-box">
    <div class="stat-header">
        <h3>Tasks</h3>
        <span class="stat-badge green">{todayTasks} / {activeTasks} Active</span>
    </div>

    <div class="chart-labels-top">
        {#each weekData as d}<span>{d.label}</span>{/each}
    </div>

    <div class="graph-row">
        {#each weekData as d}
            <div class="graph-col" class:stat-active={d.isToday} class:stat-inactive={!d.isToday}>
                <div class="bar-container">
                    <div class="bar" style="height: {Math.min(60, d.tasks * 12)}px"></div>
                    {#if d.tasks > 0}<span class="bar-val stat-value">{d.tasks}</span>{/if}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    @import '$lib/styles/stats-unified.css';

    .graph-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 80px;
        padding: 0 8px;
        margin-top: 8px;
    }

    .graph-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
    }

    .bar-container {
        height: 60px;
        display: flex;
        align-items: flex-end;
        position: relative;
        width: 20px;
        justify-content: center;
    }

    .bar {
        width: 100%;
        background: #4caf50;
        border-radius: 4px 4px 0 0;
        transition: all 0.2s;
    }

    .bar-val {
        position: absolute;
        top: -20px;
        font-size: 0.75rem;
        font-weight: 700;
    }
</style>
