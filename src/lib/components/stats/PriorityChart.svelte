<script>
    import { getTrendY } from '$lib/utils/statsUtils';
    export let lineGraphData = [];
    export let maxTrendVal = 1;
    export let priorityPercents = {};
</script>

<div class="stat-box">
    <div class="stat-header">
        <h3>Priority Trends</h3>
        <div class="chart-legend">
            <span style="color:#ff7675">● High</span>
            <span style="color:#ff9800">● Med</span>
            <span style="color:#4caf50">● Low</span>
        </div>
    </div>

    <div class="chart-labels-top">
        {#each lineGraphData as d}<span>{d.label}</span>{/each}
    </div>

    <div class="chart-wrapper">
        <svg viewBox="-10 -5 320 90" class="line-chart">
            {#each [0, 20, 40, 60] as y}
                <line x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            {/each}

            <polyline fill="none" stroke="#ff7675" stroke-width="2.5" points={lineGraphData.map((d, i) => `${(i/6)*300},${getTrendY(d.High, maxTrendVal)}`).join(' ')} />
            <polyline fill="none" stroke="#ff9800" stroke-width="2.5" points={lineGraphData.map((d, i) => `${(i/6)*300},${getTrendY(d.Medium, maxTrendVal)}`).join(' ')} />
            <polyline fill="none" stroke="#4caf50" stroke-width="2.5" points={lineGraphData.map((d, i) => `${(i/6)*300},${getTrendY(d.Low, maxTrendVal)}`).join(' ')} />

            {#each lineGraphData as d, i}
                <circle cx={(i/6)*300} cy={getTrendY(d.High, maxTrendVal)} r="3" fill="#ff7675" />
                <circle cx={(i/6)*300} cy={getTrendY(d.Medium, maxTrendVal)} r="3" fill="#ff9800" />
                <circle cx={(i/6)*300} cy={getTrendY(d.Low, maxTrendVal)} r="3" fill="#4caf50" />
            {/each}
        </svg>
    </div>

    <div class="stat-divider"></div>

    <div class="priority-summary">
        <div class="p-stat">
            <span class="stat-value" style="color:#ff7675">{priorityPercents.High}%</span>
            <span class="stat-label">High</span>
        </div>
        <div class="p-sep"></div>
        <div class="p-stat">
            <span class="stat-value" style="color:#ff9800">{priorityPercents.Medium}%</span>
            <span class="stat-label">Med</span>
        </div>
        <div class="p-sep"></div>
        <div class="p-stat">
            <span class="stat-value" style="color:#4caf50">{priorityPercents.Low}%</span>
            <span class="stat-label">Low</span>
        </div>
    </div>
</div>

<style>
    @import '$lib/styles/stats-unified.css';

    .stat-box {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .chart-wrapper {
        position: relative;
        flex: 1;
        width: 100%;
        min-height: 80px;
        display: flex;
        align-items: center;
        margin-top: 8px;
    }

    .line-chart {
        width: 100%;
        height: 100%;
        overflow: visible;
    }

    .priority-summary {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin-top: 8px;
    }

    .p-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }

    .p-sep {
        width: 1px;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
    }
</style>
