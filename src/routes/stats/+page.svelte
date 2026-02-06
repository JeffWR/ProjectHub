<script>
    import { tasks } from '$lib/stores/tasks';
    import { history } from '$lib/stores/history';
    import { ArrowLeft } from 'lucide-svelte';

    // Components
    import FocusWidget from '$lib/components/stats/FocusWidget.svelte';
    import TaskWidget from '$lib/components/stats/TaskWidget.svelte';
    import HistoryList from '$lib/components/stats/HistoryList.svelte';
    import Timeline from '$lib/components/stats/Timeline.svelte';
    import Heatmap from '$lib/components/stats/Heatmap.svelte';
    import RhythmChart from '$lib/components/stats/RhythmChart.svelte';
    import PriorityChart from '$lib/components/stats/PriorityChart.svelte';

    // Utilities
    import { safeDate, getLocalDateStr, isSameDay } from '$lib/utils/statsUtils';

    // --- DATE NAVIGATION ---
    let selectedDate = new Date();
    const changeDate = (days) => {
        const newD = new Date(selectedDate);
        newD.setDate(newD.getDate() + days);
        selectedDate = newD;
    };

    // --- DATA PROCESSING ---
    let stats = { todayFocus: 0, weekFocusHrs: 0, todayTasks: 0, activeTasks: 0, totalHours: 0, avgPomo: 25, totalArchived: 0 };
    let weekData = [];
    let timelineSessions = []; 
    let archiveList = [];
    let heatmapData = []; 
    let rhythmData = []; 
    let lineGraphData = []; 
    let priorityPercents = { High: 0, Medium: 0, Low: 0 };
    let maxRhythmVal = 1;
    let maxTrendVal = 1;

    $: {
        const safeHistory = Array.isArray($history) ? $history : [];
        const safeTasks = Array.isArray($tasks) ? $tasks : [];
        const allArchived = safeTasks.filter(t => t.status === 'archived');

        const currentDay = new Date(selectedDate);
        const weekStart = new Date(currentDay);
        weekStart.setDate(currentDay.getDate() - currentDay.getDay()); // Start on Sunday
        weekStart.setHours(0,0,0,0);

        const todaysSessions = safeHistory.filter(h => isSameDay(safeDate(h.date), currentDay));
        const weekSessions = safeHistory.filter(h => {
            const d = safeDate(h.date);
            return d && d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
        });

        // 1. TIMELINE DATA
        const PIXELS_PER_HOUR = 80;
        timelineSessions = todaysSessions.map(session => {
            const d = safeDate(session.date);
            if (!d) return null;
            const startMinutes = (d.getHours() * 60) + d.getMinutes();
            const duration = session.duration || 25;
            const endD = new Date(d.getTime() + duration * 60000);
            const timeRange = `${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')} - ${endD.getHours()}:${endD.getMinutes().toString().padStart(2,'0')}`;

            return {
                ...session,
                top: (startMinutes / 60) * PIXELS_PER_HOUR,
                height: (duration / 60) * PIXELS_PER_HOUR,
                timeRange,
                label: session.taskTitle || 'Focus Session'
            };
        }).filter(Boolean);

        // 2. HEATMAP DATA
        const historyMap = {};
        safeHistory.forEach(h => {
            const d = safeDate(h.date);
            if(d) {
                const dateKey = getLocalDateStr(d);
                historyMap[dateKey] = (historyMap[dateKey] || 0) + (h.duration || 25);
            }
        });

        let tempHeatmap = [];
        const anchorDate = new Date(); 
        const dayOfWeek = anchorDate.getDay(); 
        const startHeat = new Date(anchorDate);
        startHeat.setDate(anchorDate.getDate() - dayOfWeek - (26 * 7)); 

        for (let w = 0; w < 53; w++) {
            let week = [];
            for (let d = 0; d < 7; d++) {
                const dateStr = getLocalDateStr(startHeat);
                const minutes = historyMap[dateStr] || 0;
                const isToday = isSameDay(startHeat, anchorDate);
                
                let intensity = 0;
                if (minutes > 0) intensity = 1;
                if (minutes >= 30) intensity = 2;
                if (minutes >= 60) intensity = 3;
                if (minutes >= 120) intensity = 4;

                week.push({ intensity, date: dateStr, minutes, isToday });
                startHeat.setDate(startHeat.getDate() + 1);
            }
            tempHeatmap.push(week);
        }
        heatmapData = tempHeatmap;

        // 3. RHYTHM & TRENDS
        let tempRhythm = [];
        let rMax = 0;
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const done = allArchived.filter(t => isSameDay(safeDate(t.completedAt || t.createdAt), d)).length;
            const mins = safeHistory.filter(h => isSameDay(safeDate(h.date), d)).reduce((a,b)=>a+(b.duration||0),0);
            const hrs = parseFloat((mins/60).toFixed(1));
            const daySessions = safeHistory.filter(h => isSameDay(safeDate(h.date), d));
            let avgH = 0;
            if (daySessions.length) avgH = daySessions.reduce((a,h) => a + new Date(h.date).getHours(), 0) / daySessions.length;
            
            tempRhythm.push({ label: d.toLocaleDateString('en-US', {weekday:'short'}), tasks: done, hours: hrs, time: avgH });
            rMax = Math.max(rMax, done, hrs);
        }
        rhythmData = tempRhythm;
        maxRhythmVal = rMax > 0 ? rMax : 5;

        // 4. PRIORITY LINE GRAPH
        let tempLine = [];
        let tMax = 0;
        let pCounts = { High: 0, Medium: 0, Low: 0 }; 

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dailyTasks = allArchived.filter(t => isSameDay(safeDate(t.completedAt), d));
            const counts = { High: 0, Medium: 0, Low: 0 };
            
            dailyTasks.forEach(t => {
                const p = (t.priority || 'Medium').charAt(0).toUpperCase() + (t.priority || 'Medium').slice(1).toLowerCase();
                if (counts[p] !== undefined) {
                    counts[p]++;
                    pCounts[p]++;
                }
            });
            tempLine.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), ...counts });
            tMax = Math.max(tMax, counts.High, counts.Medium, counts.Low);
        }
        lineGraphData = tempLine;
        maxTrendVal = tMax > 0 ? tMax : 3;

        const totalP = pCounts.High + pCounts.Medium + pCounts.Low;
        priorityPercents = {
            High: totalP ? Math.round((pCounts.High / totalP) * 100) : 0,
            Medium: totalP ? Math.round((pCounts.Medium / totalP) * 100) : 0,
            Low: totalP ? Math.round((pCounts.Low / totalP) * 100) : 0
        };

        // 5. STATS SUMMARY & WEEK DATA
        const totalMins = safeHistory.reduce((a,b)=>a+(b.duration||0), 0);
        stats = {
            todayFocus: todaysSessions.length,
            weekFocusHrs: (weekSessions.reduce((a,b)=>a+(b.duration||0), 0) / 60).toFixed(1),
            todayTasks: allArchived.filter(t => isSameDay(safeDate(t.completedAt), currentDay)).length,
            activeTasks: safeTasks.filter(t => t.status === 'inprogress').length,
            totalHours: (totalMins/60).toFixed(0),
            avgPomo: safeHistory.length ? Math.round(totalMins / safeHistory.length) : 25,
            totalArchived: allArchived.length
        };

        weekData = Array(7).fill(0).map((_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return {
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                isToday: isSameDay(d, currentDay),
                val: weekSessions.filter(s => isSameDay(safeDate(s.date), d)).length,
                tasks: allArchived.filter(t => isSameDay(safeDate(t.completedAt), d)).length
            };
        });
        
        archiveList = allArchived.reverse().map(t => ({
            ...t, dateStr: safeDate(t.completedAt || t.createdAt)?.toLocaleDateString() || 'Unknown'
        }));
    }
</script>

<div class="page-container">
    <div class="header-nav">
        <a href="/" class="back-link"><ArrowLeft size={18} /> Back</a>
        <h2>Statistics</h2>
    </div>

    <div class="dashboard-grid">
        
        <div class="column left-col">
            <FocusWidget {weekData} todayFocus={stats.todayFocus} weekFocusHrs={stats.weekFocusHrs} />
            <TaskWidget {weekData} todayTasks={stats.todayTasks} activeTasks={stats.activeTasks} />
            <HistoryList {archiveList} />
        </div>

        <div class="column mid-col">
            <Timeline 
                {selectedDate} 
                {timelineSessions} 
                onChangeDate={changeDate} 
            />
        </div>

        <div class="column right-col">
            <Heatmap {heatmapData} {stats} />
            <RhythmChart {rhythmData} {maxRhythmVal} />
            <PriorityChart 
                {lineGraphData} 
                {maxTrendVal} 
                {priorityPercents} 
            />
        </div>
    </div>
</div>

<style>
    .page-container {
        height: calc(100vh - 120px);
        max-width: 1400px; margin: 0 auto;
        display: flex; flex-direction: column;
        color: #eee; overflow: hidden;
    }
    .header-nav { flex-shrink: 0; display: flex; align-items: center; gap: 20px; margin-bottom: 20px; padding-left: 10px; }
    .header-nav h2 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: flex; align-items: center; gap: 5px; font-weight: 500; }

    .dashboard-grid {
        display: grid; grid-template-columns: 1.2fr 1.6fr 1.2fr;
        gap: 15px; flex: 1; min-height: 0; padding-bottom: 20px; 
    }
    
    .column { 
        display: flex; flex-direction: column; gap: 15px; 
        overflow-y: auto; padding-right: 5px; 
        scrollbar-width: none;
    }
    .column::-webkit-scrollbar { display: none; }
    .right-col { height: 100%; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
</style>