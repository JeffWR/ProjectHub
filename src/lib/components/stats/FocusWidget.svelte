<script>
    export let weekData = [];
    export let todayFocus = 0;
    export let weekFocusHrs = 0;
</script>

<div class="stat-box">
    <div class="stat-header">
        <h3>Focus</h3>
        <span class="stat-badge red">{todayFocus} today</span>
    </div>

    <div class="chart-labels-top">
        {#each weekData as d}<span>{d.label}</span>{/each}
    </div>

    <div class="graph-wrapper">
        <div class="graph-row">
            {#each weekData as d}
                <div class="graph-col" class:stat-active={d.isToday} class:stat-inactive={!d.isToday}>
                    <div class="dots-stack">
                        {#each Array(Math.min(d.val, 6)) as _}<div class="dot"></div>{/each}
                        {#if d.val === 0}<div class="dot empty"></div>{/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <div class="stat-divider"></div>
    <div class="stat-meta" style="text-align: center;">{weekFocusHrs}h this week</div>
</div>

<style>
    @import '$lib/styles/stats-unified.css';

    .stat-box { height: 100%; display: flex; flex-direction: column; }

    .graph-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        min-height: 40px;
        margin-bottom: 8px;
    }

    .graph-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 100%;
        padding: 0 8px;
    }

    .graph-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
    }

    .dots-stack {
        display: flex;
        flex-direction: column-reverse;
        gap: 3px;
        min-height: 30px;
        justify-content: flex-start;
    }

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff7675;
    }

    .dot.empty {
        background: rgba(255, 255, 255, 0.1);
    }
</style>
