<script>
    import { onMount } from 'svelte';
    import { getSmoothPath } from '$lib/utils/statsUtils';
    export let rhythmData = [];
    export let maxRhythmVal = 1;

    let mounted = false;
    onMount(() => {
        // Small delay to ensure DOM is ready
        setTimeout(() => { mounted = true; }, 50);
    });
</script>

<div class="stat-box">
    <div class="stat-header">
        <h3>Daily Rhythm</h3>
        <div class="chart-legend">
            <span style="color:#0984e3">●  Time</span>
            <span style="color:#00b894">● Tasks</span>
            <span style="color:#e17055">● Hour</span>
        </div>
    </div>

    <div class="chart-labels-top">
        {#each rhythmData as d}<span>{d.label}</span>{/each}
    </div>

    <div class="chart-wrapper">
        <svg viewBox="-10 -5 320 90" class="line-chart">
            {#each [0, 20, 40, 60] as y}
                <line x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            {/each}
            <path d={getSmoothPath(rhythmData, 'hours', maxRhythmVal)} fill="none" stroke="#0984e3" stroke-width="2.5" class="chart-line" class:animate={mounted} />
            <path d={getSmoothPath(rhythmData, 'tasks', maxRhythmVal)} fill="none" stroke="#00b894" stroke-width="2.5" class="chart-line" class:animate={mounted} style="transition-delay: 0.1s" />
            <path d={getSmoothPath(rhythmData, 'time', 24)} fill="none" stroke="#e17055" stroke-width="2.5" stroke-dasharray="4" class="chart-line" class:animate={mounted} style="transition-delay: 0.2s" />
            {#each rhythmData as d, i}
                {#if d.time > 0}
                    <circle cx={(i/6)*300} cy={(60+5) - ((d.time/24)*60)} r="3" fill="#e17055" class="chart-dot" class:animate={mounted} style="transition-delay: {0.3 + i * 0.05}s"/>
                {/if}
            {/each}
        </svg>
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
        margin-top: 8px;
    }

    .line-chart {
        width: 100%;
        height: 100%;
        overflow: visible;
    }

    .chart-line {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .chart-line.animate {
        stroke-dashoffset: 0;
    }

    .chart-dot {
        opacity: 0;
        transform: scale(0);
        transform-origin: center;
        transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .chart-dot.animate {
        opacity: 1;
        transform: scale(1);
    }
</style>
