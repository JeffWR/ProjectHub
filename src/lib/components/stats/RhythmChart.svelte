<script>
    import { getSmoothPath } from '$lib/utils/statsUtils';
    export let rhythmData = [];
    export let maxRhythmVal = 1;
</script>

<div class="stat-box flex-box">
    <div class="rhythm-header">
        <h3>Daily Rhythm</h3>
        <div class="legend-mini">
            <span style="color:#0984e3">Time</span>
            <span style="color:#00b894">Tasks</span>
            <span style="color:#e17055">Hr</span>
        </div>
    </div>
    <div class="chart-labels-top">
        {#each rhythmData as d}<span>{d.label}</span>{/each}
    </div>
    <div class="chart-wrapper">
        <svg viewBox="-10 -5 320 90" class="line-chart">
            {#each [0, 20, 40, 60] as y}<line x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.05)" stroke-width="1"/>{/each}
            <path d={getSmoothPath(rhythmData, 'hours', maxRhythmVal)} fill="none" stroke="#0984e3" stroke-width="3" />
            <path d={getSmoothPath(rhythmData, 'tasks', maxRhythmVal)} fill="none" stroke="#00b894" stroke-width="3" />
            <path d={getSmoothPath(rhythmData, 'time', 24)} fill="none" stroke="#e17055" stroke-width="3" stroke-dasharray="4" />
            {#each rhythmData as d, i}
                {#if d.time > 0}
                    <circle cx={(i/6)*300} cy={(60+5) - ((d.time/24)*60)} r="3" fill="#e17055"/>
                {/if}
            {/each}
        </svg>
    </div>
</div>

<style>
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; }
    .flex-box { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .rhythm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .rhythm-header h3 { margin: 0; font-size: 1rem; }
    .legend-mini { font-size: 0.7rem; font-weight: 600; display: flex; gap: 10px; }
    .chart-labels-top { display: flex; justify-content: space-between; padding: 0 10px; margin-bottom: 5px; font-size: 0.65rem; color: rgba(255,255,255,0.5); }
    .chart-wrapper { position: relative; flex: 1; width: 100%; min-height: 60px; }
    .line-chart { width: 100%; height: 100%; overflow: visible; }
</style>