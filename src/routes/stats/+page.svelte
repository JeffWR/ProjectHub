<script>
    import { tasks } from '$lib/stores/tasks';
    import { history } from '$lib/stores/history';
    import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-svelte';

    // --- 1. SAFE HELPERS ---
    const safeDate = (val) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    // --- 2. STATE ---
    let selectedDate = new Date();
    let isExpanded = false;

    const changeDate = (days) => {
        const newD = new Date(selectedDate);
        newD.setDate(newD.getDate() + days);
        selectedDate = newD;
    };

    // --- 3. DATA PROCESSING ---
    let stats = { todayFocus: 0, weekFocusHrs: 0, todayTasks: 0, activeTasks: 0, totalHours: 0, avgPomo: 25, totalArchived: 0 };
    let weekData = [];
    let timeline = [];
    let archiveList = [];
    let heatmapData = []; 
    let rhythmData = []; 
    let lineGraphData = []; 
    let maxRhythmVal = 1;
    let maxTrendVal = 1;

    $: {
        const safeHistory = Array.isArray($history) ? $history : [];
        const safeTasks = Array.isArray($tasks) ? $tasks : [];
        
        // --- FIX: ONLY count 'archived' tasks as completed ---
        // Removed: || t.status === 'review'
        const allArchived = safeTasks.filter(t => t.status === 'archived');

        const currentDay = new Date(selectedDate);
        const weekStart = new Date(currentDay);
        weekStart.setDate(currentDay.getDate() - currentDay.getDay());
        weekStart.setHours(0,0,0,0);

        // FILTERING
        const todaysSessions = safeHistory.filter(h => isSameDay(safeDate(h.date), currentDay));
        const weekSessions = safeHistory.filter(h => {
            const d = safeDate(h.date);
            return d && d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
        });

        // HEATMAP
        const historyMap = {};
        safeHistory.forEach(h => {
            const d = safeDate(h.date);
            if(d) historyMap[d.toISOString().split('T')[0]] = (historyMap[d.toISOString().split('T')[0]] || 0) + (h.duration || 25);
        });

        let tempHeatmap = [];
        const startHeat = new Date();
        startHeat.setDate(new Date().getDate() - (52 * 7));
        startHeat.setDate(startHeat.getDate() - startHeat.getDay());

        for (let w = 0; w < 52; w++) {
            let week = [];
            for (let d = 0; d < 7; d++) {
                const dateStr = startHeat.toISOString().split('T')[0];
                const minutes = historyMap[dateStr] || 0;
                let intensity = minutes > 200 ? 4 : minutes > 100 ? 3 : minutes > 50 ? 2 : minutes > 0 ? 1 : 0;
                week.push({ intensity, date: dateStr });
                startHeat.setDate(startHeat.getDate() + 1);
            }
            tempHeatmap.push(week);
        }
        heatmapData = tempHeatmap;

        // RHYTHM GRAPH
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

        // TRENDS
        const monthMap = {}; 
        allArchived.forEach(t => {
            const d = safeDate(t.completedAt || t.createdAt);
            if (d) {
                const k = `${d.getFullYear()}-${d.getMonth()}`;
                if (!monthMap[k]) monthMap[k] = { High: 0, Medium: 0, Low: 0 };
                const p = t.priority === 'High' ? 'High' : t.priority === 'Low' ? 'Low' : 'Medium';
                monthMap[k][p]++;
            }
        });

        let tempLine = [];
        let tMax = 0;
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const k = `${d.getFullYear()}-${d.getMonth()}`;
            const data = monthMap[k] || { High: 0, Medium: 0, Low: 0 };
            tempLine.push({ label: d.toLocaleString('default', { month: 'short' }), ...data });
            tMax = Math.max(tMax, data.High, data.Medium, data.Low);
        }
        lineGraphData = tempLine;
        maxTrendVal = tMax > 0 ? tMax : 5;

        // STATS
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

        timeline = Array(24).fill(null).map((_, h) => ({
            hour: h,
            session: todaysSessions.find(s => safeDate(s.date)?.getHours() === h)
        }));
        
        archiveList = allArchived.reverse().map(t => ({
            ...t, dateStr: safeDate(t.completedAt || t.createdAt)?.toLocaleDateString() || 'Unknown'
        }));
    }

    // --- COMPACT GRAPH SCALING ---
    // Reduced height to 60 to fit inside smaller boxes
    const GRAPH_HEIGHT = 60;
    const PADDING = 5; 
    
    const getSmoothPath = (points, key, scaleMax) => {
        if (points.length === 0) return "";
        const safeMax = scaleMax || 1;
        
        const coords = points.map((p, i) => {
            const x = (i / (points.length - 1)) * 300;
            const normalized = p[key] / safeMax;
            const y = (GRAPH_HEIGHT + PADDING) - (normalized * GRAPH_HEIGHT); 
            return [x, y];
        });

        let d = `M ${coords[0][0]} ${coords[0][1]}`;
        for (let i = 0; i < coords.length - 1; i++) {
            const p0 = coords[i === 0 ? 0 : i - 1];
            const p1 = coords[i];
            const p2 = coords[i + 1];
            const p3 = coords[i + 2] || p2;
            const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
            const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
            const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
            const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
        }
        return d;
    };

    const getTrendY = (val) => {
        const normalized = val / (maxTrendVal || 1);
        return (GRAPH_HEIGHT + PADDING) - (normalized * GRAPH_HEIGHT);
    };
</script>

<div class="page-container">
    <div class="header-nav">
        <a href="/" class="back-link"><ArrowLeft size={18} /> Back</a>
        <h2>Statistics</h2>
    </div>

    <div class="dashboard-grid">
        
        <div class="column left-col">
            <div class="stat-box">
                <div class="box-header">
                    <h3>Focus</h3>
                    <span class="highlight-val">{stats.todayFocus} today</span>
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
                <div class="meta">{stats.weekFocusHrs}h this week</div>
            </div>

            <div class="stat-box">
                <div class="box-header">
                    <h3>Tasks</h3>
                    <span class="highlight-val">{stats.todayTasks} / {stats.activeTasks} Actv</span>
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

            <div class="stat-box archive-box">
                <h3>History</h3>
                <div class="list-container">
                    {#each (isExpanded ? archiveList : archiveList.slice(0, 5)) as t (t.id)}
                        <div class="list-row">
                            <div class="row-main">
                                <span class="r-title">{t.title}</span>
                                <span class="r-date">{t.dateStr}</span>
                            </div>
                            <span class="r-time">{Math.floor(t.timeSpent||0)}m</span>
                        </div>
                    {/each}
                    {#if archiveList.length === 0}<div class="empty">No tasks yet.</div>{/if}
                </div>
                {#if archiveList.length > 5}
                    <button class="expand-btn" on:click={() => isExpanded = !isExpanded}>
                        <ChevronDown size={14}/> {isExpanded ? 'Less' : 'More'}
                    </button>
                {/if}
            </div>
        </div>

        <div class="column mid-col">
            <div class="stat-box timeline-box">
                <div class="timeline-nav">
                    <button on:click={() => changeDate(-1)}><ChevronLeft size={18}/></button>
                    <div class="date-disp">
                        <span class="dd">{selectedDate.getDate()}</span>
                        <span class="mm">{selectedDate.toLocaleString('default', { month: 'long' })}</span>
                    </div>
                    <button on:click={() => changeDate(1)}><ChevronRight size={18}/></button>
                </div>
                
                <div class="timeline-scroll">
                    {#each timeline as t}
                        <div class="time-slot">
                            <span class="hr">{t.hour}:00</span>
                            <div class="slot-fill">
                                {#if t.session}
                                    <div class="session-pill">{t.session.taskTitle}</div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="column right-col">
            
            <div class="stat-box heatmap-box">
                <h3>Yearly Activity</h3>
                <div class="heatmap-grid">
                    {#each heatmapData as week}
                        <div class="heat-col">
                            {#each week as day}
                                <div class="heat-cell level-{day.intensity}" title={day.date}></div>
                            {/each}
                        </div>
                    {/each}
                </div>
                <div class="stats-summary">
                    <div class="s-item"><strong>{stats.avgPomo}m</strong><label>Avg</label></div>
                    <div class="s-item"><strong>{stats.totalHours}</strong><label>Hours</label></div>
                    <div class="s-item"><strong>{stats.totalArchived}</strong><label>Tasks</label></div>
                </div>
            </div>

            <div class="stat-box flex-box">
                <div class="rhythm-header">
                    <h3>Daily Rhythm</h3>
                    <div class="legend-mini">
                        <span style="color:#0984e3">Time</span>
                        <span style="color:#00b894">Tasks</span>
                        <span style="color:#e17055">Hr</span>
                    </div>
                </div>
                <div class="chart-labels-top">
                    {#each rhythmData as d}<span>{d.label}</span>{/each}
                </div>
                <div class="chart-wrapper">
                    <svg viewBox="-10 -5 320 90" class="line-chart">
                        {#each [0, 20, 40, 60] as y}<line x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.05)" stroke-width="1"/>{/each}
                        
                        <path d={getSmoothPath(rhythmData, 'hours', maxRhythmVal)} fill="none" stroke="#0984e3" stroke-width="3" />
                        <path d={getSmoothPath(rhythmData, 'tasks', maxRhythmVal)} fill="none" stroke="#00b894" stroke-width="3" />
                        <path d={getSmoothPath(rhythmData, 'time', 24)} fill="none" stroke="#e17055" stroke-width="3" stroke-dasharray="4" />
                        
                        {#each rhythmData as d, i}
                            {#if d.time > 0}
                                <circle cx={(i/6)*300} cy={(60+5) - ((d.time/24)*60)} r="3" fill="#e17055"/>
                            {/if}
                        {/each}
                    </svg>
                </div>
            </div>

            <div class="stat-box flex-box">
                <h3>Priority Trends</h3>
                <div class="chart-wrapper">
                    <svg viewBox="0 0 300 90" class="line-chart">
                        <polyline fill="none" stroke="#f44336" stroke-width="2" points={lineGraphData.map((d, i) => `${i * 50 + 25},${getTrendY(d.High)}`).join(' ')} />
                        <polyline fill="none" stroke="#ff9800" stroke-width="2" points={lineGraphData.map((d, i) => `${i * 50 + 25},${getTrendY(d.Medium)}`).join(' ')} />
                        <polyline fill="none" stroke="#4caf50" stroke-width="2" points={lineGraphData.map((d, i) => `${i * 50 + 25},${getTrendY(d.Low)}`).join(' ')} />
                        
                        {#each lineGraphData as d, i}
                            <circle cx={i * 50 + 25} cy={getTrendY(d.High)} r="3" fill="#f44336" />
                            <circle cx={i * 50 + 25} cy={getTrendY(d.Medium)} r="3" fill="#ff9800" />
                            <circle cx={i * 50 + 25} cy={getTrendY(d.Low)} r="3" fill="#4caf50" />
                        {/each}
                        
                        {#each lineGraphData as d, i}
                            <text x={i * 50 + 25} y="85" font-size="10" fill="rgba(255,255,255,0.5)" text-anchor="middle">{d.label}</text>
                        {/each}
                    </svg>
                </div>
                <div class="legend">
                    <span style="color:#f44336">High</span>
                    <span style="color:#ff9800">Med</span>
                    <span style="color:#4caf50">Low</span>
                </div>
            </div>

        </div>
    </div>
</div>

<style>
    /* PAGE SETUP */
    .page-container {
        /* Extra room at bottom to prevent cut-off */
        height: calc(100vh - 120px); 
        max-width: 1400px; margin: 0 auto;
        display: flex; flex-direction: column;
        color: #eee; overflow: hidden;
    }

    .header-nav { flex-shrink: 0; display: flex; align-items: center; gap: 20px; margin-bottom: 20px; padding-left: 10px; }
    .header-nav h2 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: flex; align-items: center; gap: 5px; font-weight: 500; }

    /* GRID */
    .dashboard-grid {
        display: grid; grid-template-columns: 1.2fr 1.6fr 1.2fr;
        gap: 15px; flex: 1; min-height: 0;
        /* Safe Area padding at bottom */
        padding-bottom: 20px; 
    }
    
    .column { 
        display: flex; flex-direction: column; gap: 15px; 
        overflow-y: auto; padding-right: 5px; 
        scrollbar-width: none; -ms-overflow-style: none;
    }
    .column::-webkit-scrollbar { display: none; }
    
    /* RIGHT COLUMN: Fits screen exactly */
    .right-col { height: 100%; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }

    /* BOXES */
    /* Reduced padding to 12px for compact fit */
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; flex-shrink: 0; }
    .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .highlight-val { font-size: 0.8rem; font-weight: 700; color: #ff7675; background: rgba(255,118,117,0.1); padding: 4px 10px; border-radius: 10px; }
    .meta { font-size: 0.8rem; color: rgba(255,255,255,0.5); text-align: center; margin-top: 10px; }

    /* LEFT GRAPHS */
    .graph-row { display: flex; justify-content: space-between; align-items: flex-end; height: 60px; padding: 0 5px; }
    .graph-col { display: flex; flex-direction: column; align-items: center; gap: 6px; opacity: 0.5; }
    .graph-col.active { opacity: 1; transform: scale(1.1); font-weight: 700; }
    .day-label { font-size: 0.65rem; text-transform: uppercase; }
    .dots-stack { display: flex; flex-direction: column-reverse; gap: 3px; min-height: 40px; justify-content: flex-start; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #ff7675; }
    .dot.empty { background: rgba(255,255,255,0.1); }
    .bar-container { height: 50px; display: flex; align-items: flex-end; position: relative; width: 20px; justify-content: center; }
    .bar { width: 100%; background: #4caf50; border-radius: 3px; }
    .bar-val { position: absolute; top: -18px; font-size: 0.75rem; font-weight: 700; }

    /* ARCHIVE */
    .archive-box { flex: 1; display: flex; flex-direction: column; min-height: 200px; }
    .list-container { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .list-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .row-main { display: flex; flex-direction: column; gap: 2px; }
    .r-title { font-size: 0.9rem; font-weight: 500; }
    .r-date { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
    .r-time { font-size: 0.8rem; font-weight: 700; color: #4caf50; background: rgba(76,175,80,0.1); padding: 2px 8px; border-radius: 6px; }
    .expand-btn { margin-top: 10px; width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: none; color: white; border-radius: 8px; cursor: pointer; }

    /* TIMELINE */
    .mid-col { overflow: hidden; } 
    .mid-col .stat-box { height: 100%; padding: 0; display: flex; flex-direction: column; }
    .timeline-nav { 
        display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: rgba(0,0,0,0.2); 
        border-radius: 16px 16px 0 0; /* FIX: Square edge */
    }
    .timeline-nav button { background: none; border: none; color: white; opacity: 0.7; cursor: pointer; }
    .date-disp { text-align: center; line-height: 1; }
    .dd { font-size: 1.4rem; font-weight: 800; display: block; } .mm { font-size: 0.8rem; text-transform: uppercase; color: rgba(255,255,255,0.6); }
    
    .timeline-scroll { 
        flex: 1; overflow-y: auto; padding: 15px; 
        scrollbar-width: none; -ms-overflow-style: none; padding-bottom: 40px; /* Safe space */
    }
    .timeline-scroll::-webkit-scrollbar { display: none; }

    .time-slot { display: flex; height: 50px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .hr { width: 50px; font-size: 0.8rem; color: rgba(255,255,255,0.4); text-align: right; padding-right: 15px; }
    .slot-fill { flex: 1; height: 100%; position: relative; }
    .session-pill { position: absolute; top: 5px; bottom: 5px; left: 0; right: 10px; background: rgba(255,118,117,0.2); border-left: 3px solid #ff7675; border-radius: 6px; padding: 0 12px; display: flex; align-items: center; font-size: 0.85rem; }

    /* RIGHT COLUMN WIDGETS */
    .heatmap-box { height: auto; padding-bottom: 20px; flex-shrink: 0; } 
    .heatmap-grid { display: flex; gap: 2px; overflow: hidden; margin-bottom: 10px; height: 60px; justify-content: center; } /* Small Heatmap */
    .heat-col { display: flex; flex-direction: column; gap: 2px; }
    .heat-cell { width: 6px; height: 6px; border-radius: 1px; background: rgba(255,255,255,0.1); }
    .level-0 { background: rgba(255,255,255,0.05); } .level-1 { background: #ffcdd2; } .level-2 { background: #e57373; } .level-3 { background: #d32f2f; } .level-4 { background: #b71c1c; }
    .stats-summary { display: flex; justify-content: space-between; gap: 5px; }
    .s-item { flex: 1; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 8px; text-align: center; }
    .s-item strong { display: block; font-size: 0.9rem; } .s-item label { font-size: 0.6rem; text-transform: uppercase; opacity: 0.6; }

    /* FLEX BOXES (Rhythm & Trends) */
    .flex-box { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    
    .rhythm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .rhythm-header h3 { margin: 0; font-size: 1rem; }
    .legend-mini { font-size: 0.7rem; font-weight: 600; display: flex; gap: 10px; }
    .chart-labels-top { display: flex; justify-content: space-between; padding: 0 10px; margin-bottom: 5px; font-size: 0.65rem; color: rgba(255,255,255,0.5); }

    .chart-wrapper { position: relative; flex: 1; width: 100%; min-height: 60px; }
    .line-chart { width: 100%; height: 100%; overflow: visible; }
    .legend { display: flex; justify-content: center; gap: 10px; margin-top: auto; font-size: 0.75rem; font-weight: 600; padding-top: 5px; }
</style>