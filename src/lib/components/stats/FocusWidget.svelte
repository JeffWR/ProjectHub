<script>
    export let weekData = [];
    export let todayFocus = 0;
    export let weekFocusHrs = 0;
</script>

<div class="stat-box">
    <div class="box-header">
        <h3>Focus</h3>
        <span class="highlight-val">{todayFocus} today</span>
    </div>
    <div class="graph-row">
        {#each weekData as d}
            <div class="graph-col" class:active={d.isToday}>
                <div class="dots-stack">
                    {#each Array(Math.min(d.val, 6)) as _}<div class="dot"></div>{/each}
                    {#if d.val === 0}<div class="dot empty"></div>{/if}
                </div>
                <span class="day-label">{d.label}</span>
            </div>
        {/each}
    </div>
    <div class="meta">{weekFocusHrs}h this week</div>
</div>

<style>
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; }
    .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .highlight-val { font-size: 0.8rem; font-weight: 700; color: #ff7675; background: rgba(255,118,117,0.1); padding: 4px 10px; border-radius: 10px; }
    .graph-row { display: flex; justify-content: space-between; align-items: flex-end; height: 60px; padding: 0 5px; }
    .graph-col { display: flex; flex-direction: column; align-items: center; gap: 6px; opacity: 0.5; }
    .graph-col.active { opacity: 1; transform: scale(1.1); font-weight: 700; }
    .day-label { font-size: 0.65rem; text-transform: uppercase; }
    .dots-stack { display: flex; flex-direction: column-reverse; gap: 3px; min-height: 40px; justify-content: flex-start; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #ff7675; }
    .dot.empty { background: rgba(255,255,255,0.1); }
    .meta { font-size: 0.8rem; color: rgba(255,255,255,0.5); text-align: center; margin-top: 10px; }
</style>