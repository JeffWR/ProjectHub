<script>
    import { history } from '$lib/stores/history';

    // Group history by date (YYYY-MM-DD) to see total minutes per day
    $: dailyStats = $history.reduce((acc, session) => {
        const dateKey = session.date.split('T')[0];
        acc[dateKey] = (acc[dateKey] || 0) + session.duration;
        return acc;
    }, {});

    // Generate last 14 days for the grid
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();
</script>

<div class="calendar-wrapper">
    <h3>Last 14 Days Activity</h3>
    <div class="grid">
        {#each days as day}
            {@const minutes = dailyStats[day] || 0}
            <div 
                class="day-box" 
                style="opacity: {minutes > 0 ? 0.5 + (minutes / 100) : 0.1}"
                title="{day}: {minutes} mins"
            >
                <span class="day-label">{day.slice(8)}</span>
            </div>
        {/each}
    </div>
</div>

<style>
    .calendar-wrapper { margin-top: 30px; text-align: left; }
    .grid { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 10px; }
    .day-box {
        width: 40px; height: 40px;
        background: white;
        border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.7rem; color: #ba4949; font-weight: bold;
        flex-shrink: 0;
    }
</style>