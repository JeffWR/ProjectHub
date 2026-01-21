<script>
    import { onMount } from 'svelte';
    export let heatmapData = [];
    export let stats = {}; // { avgPomo, totalHours, totalArchived }

    let heatmapContainer;
    
    onMount(() => {
        if (heatmapContainer) {
            heatmapContainer.scrollLeft = (heatmapContainer.scrollWidth - heatmapContainer.clientWidth) / 2;
        }
    });
</script>

<div class="stat-box heatmap-box">
    <div class="box-header">
        <h3>Focus Activity</h3>
        <span style="font-size: 0.7rem; opacity: 0.6">Past & Future</span>
    </div>
    
    <div class="heatmap-container" bind:this={heatmapContainer}>
        <div class="heatmap-grid">
            {#each heatmapData as week}
                <div class="heat-col">
                    {#each week as day}
                        <div 
                            class="heat-cell level-{day.intensity}" 
                            class:is-today={day.isToday}
                            title="{day.date}: {day.minutes} mins"
                        ></div>
                    {/each}
                </div>
            {/each}
        </div>
    </div>

    <div class="legend-row">
        <span>Less</span>
        <div class="legend-scale">
            {#each [0,1,2,3,4] as i}
                <div class="heat-cell level-{i}"></div>
            {/each}
        </div>
        <span>More</span>
    </div>

    <div class="stats-summary">
        <div class="s-item"><strong>{stats.avgPomo}m</strong><label>Avg</label></div>
        <div class="s-item"><strong>{stats.totalHours}</strong><label>Hours</label></div>
        <div class="s-item"><strong>{stats.totalArchived}</strong><label>Tasks</label></div>
    </div>
</div>

<style>
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; height: auto; padding-bottom: 20px; flex-shrink: 0; }
    .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .heatmap-container { width: 100%; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
    .heatmap-grid { display: flex; gap: 3px; height: auto; min-width: max-content; }
    .heat-col { display: flex; flex-direction: column; gap: 3px; }
    .heat-cell { width: 10px; height: 10px; border-radius: 2px; background: rgba(255,255,255,0.06); transition: transform 0.1s ease-in-out, border 0.1s, box-shadow 0.1s; position: relative; }
    .heat-cell:hover { transform: scale(1.6); z-index: 100; border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 4px 6px rgba(0,0,0,0.5); }
    .heat-cell.is-today { border: 1px solid rgba(255,255,255,0.8); }
    .level-0 { background: rgba(255,255,255,0.06); }
    .level-1 { background: rgba(255, 118, 117, 0.3); }
    .level-2 { background: rgba(255, 118, 117, 0.6); }
    .level-3 { background: #ff7675; }
    .level-4 { background: #d63031; }
    .legend-row { display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 0.7rem; color: rgba(255,255,255,0.5); margin: 10px 0 15px 0; }
    .legend-scale { display: flex; gap: 3px; }
    .stats-summary { display: flex; justify-content: space-between; gap: 5px; }
    .s-item { flex: 1; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 8px; text-align: center; }
    .s-item strong { display: block; font-size: 0.9rem; } .s-item label { font-size: 0.6rem; text-transform: uppercase; opacity: 0.6; }
</style>