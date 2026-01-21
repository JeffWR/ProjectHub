<script>
    import { getTrendY } from '$lib/utils/statsUtils';
    export let lineGraphData = [];
    export let maxTrendVal = 1;
    export let priorityPercents = {};
</script>

<div class="stat-box flex-box">
    <div class="rhythm-header">
        <h3>Priority Trends</h3>
        <div class="legend-mini">
            <span style="color:#f44336">High</span>
            <span style="color:#ff9800">Med</span>
            <span style="color:#4caf50">Low</span>
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

            <polyline fill="none" stroke="#f44336" stroke-width="2" points={lineGraphData.map((d, i) => `${(i/6)*300},${getTrendY(d.High, maxTrendVal)}`).join(' ')} />
            <polyline fill="none" stroke="#ff9800" stroke-width="2" points={lineGraphData.map((d, i) => `${(i/6)*300},${getTrendY(d.Medium, maxTrendVal)}`).join(' ')} />
            <polyline fill="none" stroke="#4caf50" stroke-width="2" points={lineGraphData.map((d, i) => `${(i/6)*300},${getTrendY(d.Low, maxTrendVal)}`).join(' ')} />
            
            {#each lineGraphData as d, i}
                <circle cx={(i/6)*300} cy={getTrendY(d.High, maxTrendVal)} r="3" fill="#f44336" />
                <circle cx={(i/6)*300} cy={getTrendY(d.Medium, maxTrendVal)} r="3" fill="#ff9800" />
                <circle cx={(i/6)*300} cy={getTrendY(d.Low, maxTrendVal)} r="3" fill="#4caf50" />
            {/each}
        </svg>
    </div>

    <div class="priority-summary">
        <div class="p-stat"><span class="p-val" style="color:#f44336">{priorityPercents.High}%</span></div>
        <div class="p-sep"></div>
        <div class="p-stat"><span class="p-val" style="color:#ff9800">{priorityPercents.Medium}%</span></div>
        <div class="p-sep"></div>
        <div class="p-stat"><span class="p-val" style="color:#4caf50">{priorityPercents.Low}%</span></div>
    </div>
</div>

<style>
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; }
    .flex-box { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .rhythm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .rhythm-header h3 { margin: 0; font-size: 1rem; }
    .legend-mini { font-size: 0.7rem; font-weight: 600; display: flex; gap: 10px; }
    .chart-labels-top { display: flex; justify-content: space-between; padding: 0 5px; font-size: 0.6rem; color: rgba(255,255,255,0.4); margin-bottom: 5px; }
    .chart-wrapper { position: relative; flex: 1; width: 100%; min-height: 60px; display: flex; align-items: center; }
    .line-chart { width: 100%; height: 100%; overflow: visible; }
    .priority-summary { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 5px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
    .p-stat { display: flex; flex-direction: column; align-items: center; }
    .p-val { font-weight: 700; font-size: 0.9rem; }
    .p-sep { width: 1px; height: 15px; background: rgba(255,255,255,0.1); }
</style>