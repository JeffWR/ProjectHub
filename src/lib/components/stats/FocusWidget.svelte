<script>
    import { onMount } from 'svelte';
    export let weekData = [];
    export let todayFocus = 0;
    export let weekFocusHrs = 0;

    let mounted = false;
    onMount(() => {
        setTimeout(() => { mounted = true; }, 50);
    });
</script>

<div class="stat-box">
    <div class="stat-header">
        <h3>Focus</h3>
        <span class="stat-badge red" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.5s ease-out">{todayFocus} today</span>
    </div>

    <div class="chart-labels-top">
        {#each weekData as d}<span>{d.label}</span>{/each}
    </div>

    <div class="graph-row">
        {#each weekData as d, colIndex}
            <div class="graph-col" class:stat-active={d.isToday} class:stat-inactive={!d.isToday}>
                <div class="dots-container">
                    <div class="dots-stack">
                        {#each Array(Math.min(d.val, 6)) as _, i}
                            <div class="dot" class:animate={mounted} style="transition-delay: {colIndex * 0.05 + i * 0.03}s"></div>
                        {/each}
                        {#if d.val === 0}<div class="dot empty" class:animate={mounted} style="transition-delay: {colIndex * 0.05}s"></div>{/if}
                    </div>
                    {#if d.val > 0}<span class="dot-val stat-value" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.5s ease-out {colIndex * 0.05 + 0.2}s">{d.val}</span>{/if}
                </div>
            </div>
        {/each}
    </div>

    <div class="stat-divider"></div>
    <div class="stat-meta" style="text-align: center; opacity: {mounted ? 1 : 0}; transition: opacity 0.5s ease-out 0.5s">{weekFocusHrs}h this week</div>
</div>

<style>
    @import '$lib/styles/stats-unified.css';

    .graph-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 80px;
        padding: 0 8px;
        margin-top: 8px;
    }

    .graph-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
    }

    .dots-container {
        height: 60px;
        display: flex;
        align-items: flex-end;
        position: relative;
        width: 20px;
        justify-content: center;
    }

    .dots-stack {
        display: flex;
        flex-direction: column-reverse;
        gap: 3px;
        min-height: 8px;
    }

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff7675;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.4s ease, transform 0.4s ease;
    }

    .dot.animate {
        opacity: 1;
        transform: translateY(0);
    }

    .dot.empty {
        background: var(--surface-hover);
    }

    .dot-val {
        position: absolute;
        top: -20px;
        font-size: 0.75rem;
        font-weight: 700;
    }
</style>
