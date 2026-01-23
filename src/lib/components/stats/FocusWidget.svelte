<script>
    export let weekData = [];
    export let todayFocus = 0;
    export let weekFocusHrs = 0;
</script>

<div class="stat-box flex-box">
    <div class="rhythm-header">
        <h3>Focus</h3>
        <span class="highlight-val">{todayFocus} today</span>
    </div>

    <div class="chart-labels-top">
        {#each weekData as d}<span>{d.label}</span>{/each}
    </div>

    <div class="graph-wrapper">
        <div class="graph-row">
            {#each weekData as d}
                <div class="graph-col" class:active={d.isToday}>
                    <div class="dots-stack">
                        {#each Array(Math.min(d.val, 6)) as _}<div class="dot"></div>{/each}
                        {#if d.val === 0}<div class="dot empty"></div>{/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
    
    <div class="meta">{weekFocusHrs}h this week</div>
</div>

<style>
    /* Container Styles (Matched to PriorityChart) */
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; }
    .flex-box { display: flex; flex-direction: column; height: 100%; }

    /* Header (Matched) */
    .rhythm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .rhythm-header h3 { margin: 0; font-size: 1rem; }
    
    .highlight-val { font-size: 0.8rem; font-weight: 700; color: #ff7675; background: rgba(255,118,117,0.1); padding: 4px 10px; border-radius: 10px; }

    /* Labels Top (Matched) */
    .chart-labels-top { 
        display: flex; justify-content: space-between; padding: 0 5px; 
        font-size: 0.6rem; color: rgba(255,255,255,0.4); margin-bottom: 10px; 
    }

    /* Graph Layout */
    .graph-wrapper { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; min-height: 60px; }
    .graph-row { display: flex; justify-content: space-between; align-items: flex-end; height: 100%; padding: 0 5px; }
    
    .graph-col { display: flex; flex-direction: column; align-items: center; gap: 6px; opacity: 0.5; }
    .graph-col.active { opacity: 1; transform: scale(1.1); font-weight: 700; }
    
    .dots-stack { display: flex; flex-direction: column-reverse; gap: 3px; min-height: 40px; justify-content: flex-start; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #ff7675; }
    .dot.empty { background: rgba(255,255,255,0.1); }
    
    .meta { 
        font-size: 0.8rem; color: rgba(255,255,255,0.5); text-align: center; 
        margin-top: 10px; padding-top: 10px; 
        border-top: 1px solid rgba(255,255,255,0.05); 
    }
</style>