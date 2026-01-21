<script>
    import { ChevronLeft, ChevronRight } from 'lucide-svelte';
    import { isSameDay } from '$lib/utils/statsUtils';

    export let selectedDate;
    export let timelineSessions = [];
    export let onChangeDate; // function prop

    const HOURS_IN_DAY = 24;
    const PIXELS_PER_HOUR = 80;
</script>

<div class="stat-box timeline-box">
    <div class="timeline-nav">
        <button on:click={() => onChangeDate(-1)}><ChevronLeft size={18}/></button>
        <div class="date-disp">
            <span class="dd">{selectedDate.getDate()}</span>
            <span class="mm">{selectedDate.toLocaleString('default', { month: 'long' })}</span>
        </div>
        <button on:click={() => onChangeDate(1)}><ChevronRight size={18}/></button>
    </div>
    
    <div class="timeline-scroll">
        <div class="daily-grid" style="height: {HOURS_IN_DAY * PIXELS_PER_HOUR}px">
            {#each Array(HOURS_IN_DAY) as _, h}
                <div class="grid-hour" style="top: {h * PIXELS_PER_HOUR}px; height: {PIXELS_PER_HOUR}px;">
                    <span class="grid-label">{h}:00</span>
                    <div class="grid-line"></div>
                </div>
            {/each}

            {#each timelineSessions as t}
                <div 
                    class="event-block"
                    style="top: {t.top}px; height: {t.height}px;"
                    title="{t.label}&#10;{selectedDate.toLocaleDateString()} • {t.timeRange} ({t.duration}m)"
                >
                    <div class="ev-content">
                        <span class="ev-time">{t.timeRange}</span>
                        <span class="ev-title">{t.label}</span>
                    </div>
                </div>
            {/each}

            {#if isSameDay(selectedDate, new Date())}
                <div class="now-indicator" style="top: {((new Date().getHours() * 60) + new Date().getMinutes()) / 60 * PIXELS_PER_HOUR}px"></div>
            {/if}
        </div>
    </div>
</div>

<style>
    .timeline-box { height: 100%; padding: 0; display: flex; flex-direction: column; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }
    .timeline-nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: rgba(0,0,0,0.2); z-index: 2; }
    .timeline-nav button { background: none; border: none; color: white; opacity: 0.7; cursor: pointer; }
    .date-disp { text-align: center; line-height: 1; }
    .dd { font-size: 1.4rem; font-weight: 800; display: block; } .mm { font-size: 0.8rem; text-transform: uppercase; color: rgba(255,255,255,0.6); }
    .timeline-scroll { flex: 1; overflow-y: auto; scrollbar-width: none; position: relative; }
    .timeline-scroll::-webkit-scrollbar { display: none; }
    .daily-grid { position: relative; width: 100%; }
    .grid-hour { position: absolute; left: 0; right: 0; display: flex; align-items: flex-start; padding-top: 5px; }
    .grid-label { width: 50px; text-align: right; padding-right: 15px; font-size: 0.75rem; color: rgba(255,255,255,0.3); }
    .grid-line { flex: 1; border-top: 1px solid rgba(255,255,255,0.05); height: 100%; }
    .event-block { position: absolute; left: 60px; right: 15px; background: rgba(255,118,117,0.15); border-left: 3px solid #ff7675; border-radius: 4px; padding: 2px 8px; overflow: hidden; z-index: 10; transition: all 0.2s; cursor: default; }
    .event-block:hover { transform: scale(1.02) translateY(-1px); z-index: 50; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-left-width: 5px; background: rgba(255,118,117,0.25); }
    .ev-content { display: flex; flex-direction: column; justify-content: center; height: 100%; }
    .ev-time { font-size: 0.65rem; color: rgba(255,255,255,0.6); line-height: 1; margin-bottom: 2px; }
    .ev-title { font-size: 0.8rem; font-weight: 600; color: #ff7675; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1; }
    .now-indicator { position: absolute; left: 55px; right: 0; height: 1px; background: #0984e3; z-index: 20; box-shadow: 0 0 4px #0984e3; }
    .now-indicator::before { content: ''; position: absolute; left: -4px; top: -3px; width: 6px; height: 6px; border-radius: 50%; background: #0984e3; }
</style>