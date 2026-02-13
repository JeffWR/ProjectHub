<script>
    import { onMount } from 'svelte';
    import { ChevronLeft, ChevronRight } from 'lucide-svelte';
    import { isSameDay } from '$lib/utils/statsUtils';

    export let selectedDate;
    export let timelineSessions = [];
    export let onChangeDate; // function prop

    const HOURS_IN_DAY = 24;
    const PIXELS_PER_HOUR = 80;

    let timelineScroll;
    let mounted = false;

    onMount(() => {
        if (timelineScroll && isSameDay(selectedDate, new Date())) {
            // Center on current time
            const now = new Date();
            const currentMinutes = (now.getHours() * 60) + now.getMinutes();
            const currentPosition = (currentMinutes / 60) * PIXELS_PER_HOUR;
            const containerHeight = timelineScroll.clientHeight;

            // Scroll so current time is centered
            timelineScroll.scrollTop = currentPosition - (containerHeight / 2);
        }
        setTimeout(() => { mounted = true; }, 50);
    });

    // Also scroll to center when date changes to today
    $: if (timelineScroll && isSameDay(selectedDate, new Date())) {
        const now = new Date();
        const currentMinutes = (now.getHours() * 60) + now.getMinutes();
        const currentPosition = (currentMinutes / 60) * PIXELS_PER_HOUR;
        const containerHeight = timelineScroll.clientHeight;
        timelineScroll.scrollTop = currentPosition - (containerHeight / 2);
    }
</script>

<div class="stat-box timeline-box">
    <div class="timeline-nav">
        <button class="nav-btn" on:click={() => onChangeDate(-1)}>
            <ChevronLeft size={18}/>
        </button>
        <div class="date-display" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.3s ease">
            <span class="stat-value day-num">{selectedDate.getDate()}</span>
            <span class="stat-label month-name">{selectedDate.toLocaleString('default', { month: 'long' })}</span>
        </div>
        <button class="nav-btn" on:click={() => onChangeDate(1)}>
            <ChevronRight size={18}/>
        </button>
    </div>

    <div class="timeline-scroll" bind:this={timelineScroll}>
        <div class="daily-grid" style="height: {HOURS_IN_DAY * PIXELS_PER_HOUR}px">
            {#each Array(HOURS_IN_DAY) as _, h}
                <div class="grid-hour" style="top: {h * PIXELS_PER_HOUR}px; height: {PIXELS_PER_HOUR}px; opacity: {mounted ? 1 : 0}; transition: opacity 0.25s ease">
                    <span class="grid-label stat-label">{h}:00</span>
                    <div class="grid-line" class:animate={mounted} style="transition-delay: {0.3 + h * 0.02}s"></div>
                </div>
            {/each}

            {#each timelineSessions as t, i}
                <div
                    class="event-block"
                    class:animate={mounted}
                    style="top: {t.top}px; height: {t.height}px; transition-delay: {i * 0.05}s"
                    title="{t.label}&#10;{selectedDate.toLocaleDateString()} • {t.timeRange} ({t.duration}m)"
                >
                    <div class="ev-content">
                        <span class="ev-time stat-label">{t.timeRange}</span>
                        <span class="ev-title">{t.label}</span>
                    </div>
                </div>
            {/each}

            {#if isSameDay(selectedDate, new Date())}
                <div class="now-indicator" class:animate={mounted} style="top: {((new Date().getHours() * 60) + new Date().getMinutes()) / 60 * PIXELS_PER_HOUR}px"></div>
            {/if}
        </div>
    </div>
</div>

<style>
    @import '$lib/styles/stats-unified.css';

    .timeline-box {
        height: 100%;
        padding: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .timeline-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.2);
        z-index: 2;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .nav-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.8);
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .nav-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: white;
    }

    .date-display {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .day-num {
        font-size: 1.5rem;
        font-weight: 800;
        line-height: 1;
    }

    .month-name {
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .timeline-scroll {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: none;
        position: relative;
    }

    .timeline-scroll::-webkit-scrollbar {
        display: none;
    }

    .daily-grid {
        position: relative;
        width: 100%;
    }

    .grid-hour {
        position: absolute;
        left: 0;
        right: 0;
        display: flex;
        align-items: flex-start;
        padding-top: 8px;
    }

    .grid-label {
        width: 50px;
        text-align: right;
        padding-right: 12px;
    }

    .grid-line {
        flex: 1;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        height: 100%;
        transform-origin: left center;
        transform: scaleX(0);
        transition: transform 0.4s ease;
    }

    .grid-line.animate {
        transform: scaleX(1);
    }

    .event-block {
        position: absolute;
        left: 60px;
        right: 15px;
        background: rgba(255, 118, 117, 0.15);
        border-left: 3px solid #ff7675;
        border-radius: 6px;
        padding: 6px 10px;
        overflow: hidden;
        z-index: 10;
        cursor: default;
        opacity: 0;
        transform: translateX(-20px);
        transition: all 0.2s, opacity 0.3s ease, transform 0.3s ease;
    }

    .event-block.animate {
        opacity: 1;
        transform: translateX(0);
    }

    .event-block:hover {
        transform: scale(1.02) translateY(-1px);
        z-index: 50;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border-left-width: 4px;
        background: rgba(255, 118, 117, 0.25);
    }

    .ev-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        gap: 2px;
    }

    .ev-time {
        font-size: 0.7rem;
    }

    .ev-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #ff7675;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
    }

    .now-indicator {
        position: absolute;
        left: 55px;
        right: 0;
        height: 2px;
        background: #0984e3;
        z-index: 20;
        box-shadow: 0 0 6px #0984e3;
        transform-origin: left center;
        transform: scaleX(0);
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
    }

    .now-indicator.animate {
        transform: scaleX(1);
    }

    .now-indicator::before {
        content: '';
        position: absolute;
        left: -4px;
        top: -3px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #0984e3;
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
    }
</style>
