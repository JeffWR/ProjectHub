<script>
    export let weekData = [];
    export let todayTasks = 0;
    export let activeTasks = 0;
</script>

<div class="stat-box">
    <div class="box-header">
        <h3>Tasks</h3>
        <span class="highlight-val">{todayTasks} / {activeTasks} Actv</span>
    </div>
    <div class="graph-row">
        {#each weekData as d}
            <div class="graph-col" class:active={d.isToday}>
                <div class="bar-container">
                    <div class="bar" style="height: {Math.min(50, d.tasks * 10)}px"></div>
                    {#if d.tasks > 0}<span class="bar-val">{d.tasks}</span>{/if}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; }
    .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .highlight-val { font-size: 0.8rem; font-weight: 700; color: #ff7675; background: rgba(255,118,117,0.1); padding: 4px 10px; border-radius: 10px; }
    .graph-row { display: flex; justify-content: space-between; align-items: flex-end; height: 60px; padding: 0 5px; }
    .graph-col { display: flex; flex-direction: column; align-items: center; gap: 6px; opacity: 0.5; }
    .graph-col.active { opacity: 1; transform: scale(1.1); font-weight: 700; }
    .bar-container { height: 50px; display: flex; align-items: flex-end; position: relative; width: 20px; justify-content: center; }
    .bar { width: 100%; background: #4caf50; border-radius: 3px; }
    .bar-val { position: absolute; top: -18px; font-size: 0.75rem; font-weight: 700; }
</style>