<script>
    import { onMount } from 'svelte';
    export let heatmapData = [];
    export let stats = {}; // { avgPomo, totalHours, totalArchived }

    let heatmapContainer;
    let mounted = false;

    onMount(() => {
        if (heatmapContainer) {
            heatmapContainer.scrollLeft = (heatmapContainer.scrollWidth - heatmapContainer.clientWidth) / 2;
        }
        setTimeout(() => { mounted = true; }, 50);
    });
</script>

<div class="stat-box heatmap-box">
    <div class="stat-header">
        <h3>Focus Activity</h3>
        <span class="stat-label">Past Year</span>
    </div>

    <div class="heatmap-container" bind:this={heatmapContainer}>
        <div class="heatmap-grid" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.4s ease-out">
            {#each heatmapData as week, weekIndex}
                <div class="heat-col">
                    {#each week as day, dayIndex}
                        <div class="heat-cell-wrapper">
                            <div
                                class="heat-cell level-{day.intensity}"
                                class:is-today={day.isToday}
                                title="{day.date}: {day.minutes} mins"
                            ></div>
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    </div>

    <div class="legend-row">
        <span class="stat-label" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.2s ease-out 0s">Less</span>
        <div class="legend-scale">
            {#each [0,1,2,3,4] as i}
                <div class="heat-cell level-{i}" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.2s ease-out {0.05 + i * 0.03}s"></div>
            {/each}
        </div>
        <span class="stat-label" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.2s ease-out 0.2s">More</span>
    </div>

    <div class="stat-divider"></div>

    <div class="stats-summary">
        <div class="s-item" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.2s ease-out 0.1s">
            <span class="stat-value">{stats.avgPomo}m</span>
            <span class="stat-label">Avg</span>
        </div>
        <div class="s-item" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.2s ease-out 0.15s">
            <span class="stat-value">{stats.totalHours}h</span>
            <span class="stat-label">Total</span>
        </div>
        <div class="s-item" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.2s ease-out 0.2s">
            <span class="stat-value">{stats.totalArchived}</span>
            <span class="stat-label">Tasks</span>
        </div>
    </div>
</div>

<style>
    @import '$lib/styles/stats-unified.css';

    .heatmap-box {
        height: auto;
        padding-bottom: 16px;
        flex-shrink: 0;
        contain: layout style;
    }

    .heatmap-container {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 8px;
        scrollbar-width: none;
        margin-top: 8px;
        overflow-y: visible;
    }

    .heatmap-container::-webkit-scrollbar {
        display: none;
    }

    .heatmap-grid {
        display: flex;
        gap: 3px;
        height: auto;
        min-width: max-content;
        padding: 10px 0;
    }

    .heat-col {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .heat-cell-wrapper {
        width: 10px;
        height: 10px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .heat-cell {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.06);
        transition: transform 0.12s cubic-bezier(0.4, 0, 0.2, 1),
                    border 0.12s ease,
                    box-shadow 0.12s ease;
        position: absolute;
        will-change: transform;
    }

    .heat-cell:hover {
        transform: scale(1.6);
        z-index: 100;
        border: 1px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
    }

    .heat-cell.is-today {
        border: 1px solid rgba(255, 255, 255, 0.8);
    }

    .level-0 { background: rgba(255, 255, 255, 0.06); }
    .level-1 { background: rgba(255, 118, 117, 0.3); }
    .level-2 { background: rgba(255, 118, 117, 0.6); }
    .level-3 { background: #ff7675; }
    .level-4 { background: #d63031; }

    .legend-row {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        margin: 12px 0;
    }

    .legend-scale {
        display: flex;
        gap: 3px;
    }

    .legend-scale .heat-cell {
        position: relative;
        width: 12px;
        height: 12px;
        pointer-events: none;
    }

    .legend-scale .heat-cell:hover {
        transform: none;
        border: none;
        box-shadow: none;
        z-index: auto;
    }

    .stats-summary {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 8px;
    }

    .s-item {
        flex: 1;
        background: rgba(255, 255, 255, 0.05);
        padding: 8px;
        border-radius: 8px;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
</style>
