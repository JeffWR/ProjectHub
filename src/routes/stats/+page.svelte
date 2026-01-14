<script>
    import { tasks } from '$lib/stores/tasks';
    import { history } from '$lib/stores/history';
    import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-svelte';
    import { onMount } from 'svelte';

    // --- 1. SAFE HELPERS ---
    const safeDate = (val) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    // Helper to get "YYYY-MM-DD" in LOCAL time (fixes timezone bugs)
    const getLocalDateStr = (dateObj) => {
        if (!dateObj) return '';
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    // --- 2. UI STATE ---
    let listContainer;
    let isExpanded = false;
    let isClosing = false;
    let heatmapContainer; // Reference for auto-scrolling

    async function toggleExpand() {
        if (isExpanded) {
            isClosing = true; 
            setTimeout(() => { if (listContainer) listContainer.scrollTo({ top: 0, behavior: 'smooth' }); }, 5);
            setTimeout(() => { isExpanded = false; isClosing = false; }, 100);
        } else {
            isExpanded = true;
        }
    }

    // Scroll heatmap to center on load
    onMount(() => {
        if (heatmapContainer) {
            // Scroll to the middle (approx where "Today" is)
            heatmapContainer.scrollLeft = (heatmapContainer.scrollWidth - heatmapContainer.clientWidth) / 2;
        }
    });

    // --- 3. DATE NAVIGATION ---
    let selectedDate = new Date();

    const changeDate = (days) => {
        const newD = new Date(selectedDate);
        newD.setDate(newD.getDate() + days);
        selectedDate = newD;
    };

    // --- 4. DATA PROCESSING ---
    let stats = { todayFocus: 0, weekFocusHrs: 0, todayTasks: 0, activeTasks: 0, totalHours: 0, avgPomo: 25, totalArchived: 0 };
    let weekData = [];
    
    // TIMELINE DATA
    let timelineSessions = []; 
    const HOURS_IN_DAY = 24;
    const PIXELS_PER_HOUR = 80;
    
    let archiveList = [];
    let heatmapData = []; 
    let rhythmData = []; 
    
    // Priority Data
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

        // --- TIMELINE LOGIC ---
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

        // --- HEATMAP LOGIC (Centered on Today) ---
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

        // --- RHYTHM ---
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

        // --- PRIORITY TRENDS (UPDATED: Last 7 Days) ---
        let tempLine = [];
        let tMax = 0;
        let pCounts = { High: 0, Medium: 0, Low: 0 }; // Counts for the whole week

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            // Get tasks for this specific day
            const dailyTasks = allArchived.filter(t => isSameDay(safeDate(t.completedAt), d));
            
            const counts = { High: 0, Medium: 0, Low: 0 };
            
            dailyTasks.forEach(t => {
                const p = (t.priority || 'Medium').charAt(0).toUpperCase() + (t.priority || 'Medium').slice(1).toLowerCase();
                if (counts[p] !== undefined) {
                    counts[p]++;
                    pCounts[p]++; // Add to total
                }
            });

            tempLine.push({ 
                label: d.toLocaleDateString('en-US', { weekday: 'short' }), 
                ...counts 
            });
            
            tMax = Math.max(tMax, counts.High, counts.Medium, counts.Low);
        }
        
        lineGraphData = tempLine;
        maxTrendVal = tMax > 0 ? tMax : 3;

        // Calculate Percentages
        const totalP = pCounts.High + pCounts.Medium + pCounts.Low;
        priorityPercents = {
            High: totalP ? Math.round((pCounts.High / totalP) * 100) : 0,
            Medium: totalP ? Math.round((pCounts.Medium / totalP) * 100) : 0,
            Low: totalP ? Math.round((pCounts.Low / totalP) * 100) : 0
        };

        // --- STATS SUMMARY ---
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

    // --- GRAPH DRAWING HELPERS ---
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
                <div class="list-container" class:scroll-mode={isExpanded} class:closing={isClosing} bind:this={listContainer}>
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
                    <button class="expand-btn" on:click={toggleExpand}>
                        <div class="arrow-wrap" class:flipped={isExpanded}> <ChevronDown size={14} /> </div>
                        {isExpanded ? 'Show Less' : 'More'}
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
        </div>

        <div class="column right-col">
            
            <div class="stat-box heatmap-box">
                <div class="box-header">
                    <h3>Focus Activity</h3>
                    <span style="font-size: 0.7rem; opacity: 0.6">Past & Future</span>
                </div>
                
                <div class="heatmap-container" bind:this={heatmapContainer}>
                    <div class="heatmap-grid">
                        {#each heatmapData as week}
                            <div class="heat-col">
                                {#each week as day}
                                    <div 
                                        class="heat-cell level-{day.intensity}" 
                                        class:is-today={day.isToday}
                                        title="{day.date}: {day.minutes} mins"
                                    ></div>
                                {/each}
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="legend-row">
                    <span>Less</span>
                    <div class="legend-scale">
                        <div class="heat-cell level-0"></div>
                        <div class="heat-cell level-1"></div>
                        <div class="heat-cell level-2"></div>
                        <div class="heat-cell level-3"></div>
                        <div class="heat-cell level-4"></div>
                    </div>
                    <span>More</span>
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
                <div class="rhythm-header">
                    <h3>Priority Trends</h3>
                    <div class="legend-mini">
                        <span style="color:#f44336">High</span>
                        <span style="color:#ff9800">Med</span>
                        <span style="color:#4caf50">Low</span>
                    </div>
                </div>

                <div class="chart-labels-top">
                    {#each lineGraphData as d}<span>{d.label}</span>{/each}
                </div>

                <div class="chart-wrapper">
                    <svg viewBox="-10 -5 320 90" class="line-chart">
                        {#each [0, 20, 40, 60] as y}
                            <line x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                        {/each}

                        <path d={getSmoothPath(lineGraphData, 'High', maxTrendVal)} fill="none" stroke="#f44336" stroke-width="3" />
                        <path d={getSmoothPath(lineGraphData, 'Medium', maxTrendVal)} fill="none" stroke="#ff9800" stroke-width="3" />
                        <path d={getSmoothPath(lineGraphData, 'Low', maxTrendVal)} fill="none" stroke="#4caf50" stroke-width="3" />
                        
                        {#each lineGraphData as d, i}
                            <circle cx={(i/6)*300} cy={(65) - ((d.High/maxTrendVal)*60)} r="3" fill="#f44336" />
                            <circle cx={(i/6)*300} cy={(65) - ((d.Medium/maxTrendVal)*60)} r="3" fill="#ff9800" />
                            <circle cx={(i/6)*300} cy={(65) - ((d.Low/maxTrendVal)*60)} r="3" fill="#4caf50" />
                        {/each}
                    </svg>
                </div>

                <div class="priority-summary">
                    <div class="p-stat">
                        <span class="p-val" style="color:#f44336">{priorityPercents.High}%</span>
                    </div>
                    <div class="p-sep"></div>
                    <div class="p-stat">
                        <span class="p-val" style="color:#ff9800">{priorityPercents.Medium}%</span>
                    </div>
                    <div class="p-sep"></div>
                    <div class="p-stat">
                        <span class="p-val" style="color:#4caf50">{priorityPercents.Low}%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* PAGE SETUP */
    .page-container {
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
        padding-bottom: 20px; 
    }
    
    .column { 
        display: flex; flex-direction: column; gap: 15px; 
        overflow-y: auto; padding-right: 5px; 
        scrollbar-width: none; -ms-overflow-style: none;
    }
    .column::-webkit-scrollbar { display: none; }
    
    .right-col { height: 100%; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }

    /* BOXES */
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

    /* ARCHIVE BOX */
    .archive-box { flex: 1; display: flex; flex-direction: column; min-height: 200px; }
    .list-container {
        display: flex; flex-direction: column; gap: 10px;
        max-height: 280px; overflow: hidden;
        transition: max-height 0.2s ease-out, -webkit-mask-position 0.2s ease-out, mask-position 0.2s ease-out;
        -webkit-mask-image: linear-gradient(to bottom, black 50%, black 85%, transparent 100%);
        mask-image: linear-gradient(to bottom, black 50%, black 85%, transparent 100%);
        -webkit-mask-size: 100% 200%; -webkit-mask-position: 0 0; mask-position: 0 0;
    }
    .list-container.scroll-mode {
        overflow-y: auto; padding-bottom: 20px;
        scrollbar-width: none; -ms-overflow-style: none;
        -webkit-mask-position: 0 100%; mask-position: 0 100%;
    }
    .list-container.scroll-mode::-webkit-scrollbar { display: none; }
    .list-container.closing { -webkit-mask-position: 0 0 !important; mask-position: 0 0 !important; transition: none !important; overflow-y: hidden; }
    .list-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
    .row-main { display: flex; flex-direction: column; gap: 2px; }
    .r-title { font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; display: inline-block; vertical-align: middle; }
    .r-date { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
    .r-time { font-size: 0.8rem; font-weight: 700; color: #4caf50; background: rgba(76,175,80,0.1); padding: 2px 8px; border-radius: 6px; }
    .expand-btn { margin-top: 10px; width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: none; color: white; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .arrow-wrap { display: flex; align-items: center; transition: transform 0.2s ease; }
    .flipped { transform: rotate(180deg); }

    /* TIMELINE */
    .mid-col { overflow: hidden; } 
    .mid-col .stat-box { height: 100%; padding: 0; display: flex; flex-direction: column; }
    
    .timeline-nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: rgba(0,0,0,0.2); border-radius: 16px 16px 0 0; z-index: 2; position: relative; }
    .timeline-nav button { background: none; border: none; color: white; opacity: 0.7; cursor: pointer; }
    .date-disp { text-align: center; line-height: 1; }
    .dd { font-size: 1.4rem; font-weight: 800; display: block; } .mm { font-size: 0.8rem; text-transform: uppercase; color: rgba(255,255,255,0.6); }
    .timeline-scroll { flex: 1; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; position: relative; }
    .timeline-scroll::-webkit-scrollbar { display: none; }
    .daily-grid { position: relative; width: 100%; }
    .grid-hour { position: absolute; left: 0; right: 0; display: flex; align-items: flex-start; padding-top: 5px; }
    .grid-label { width: 50px; text-align: right; padding-right: 15px; font-size: 0.75rem; color: rgba(255,255,255,0.3); }
    .grid-line { flex: 1; border-top: 1px solid rgba(255,255,255,0.05); height: 100%; }
    
    .event-block { 
        position: absolute; left: 60px; right: 15px; 
        background: rgba(255,118,117,0.15); 
        border-left: 3px solid #ff7675; 
        border-radius: 4px; 
        padding: 2px 8px; 
        overflow: hidden; 
        z-index: 10; 
        transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1.2), box-shadow 0.15s, border-left-width 0.1s;
        cursor: default; 
    }
    
    /* THE POP EFFECT (TIMELINE HOVER) */
    .event-block:hover {
        transform: scale(1.02) translateY(-1px);
        z-index: 50; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border-left-width: 5px;
        background: rgba(255,118,117,0.25);
    }

    .ev-content { display: flex; flex-direction: column; justify-content: center; height: 100%; pointer-events: none; }
    .ev-time { font-size: 0.65rem; color: rgba(255,255,255,0.6); line-height: 1; margin-bottom: 2px; }
    .ev-title { font-size: 0.8rem; font-weight: 600; color: #ff7675; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1; }
    .now-indicator { position: absolute; left: 55px; right: 0; height: 1px; background: #0984e3; z-index: 20; box-shadow: 0 0 4px #0984e3; }
    .now-indicator::before { content: ''; position: absolute; left: -4px; top: -3px; width: 6px; height: 6px; border-radius: 50%; background: #0984e3; }

    /* --- RIGHT COLUMN WIDGETS --- */
    
    .heatmap-box { height: auto; padding-bottom: 20px; flex-shrink: 0; }
    .heatmap-container { width: 100%; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
    
    .heatmap-grid { display: flex; gap: 3px; height: auto; min-width: max-content; }
    
    .heat-col { display: flex; flex-direction: column; gap: 3px; }
    
    .heat-cell { 
        width: 10px; height: 10px; 
        border-radius: 2px; 
        background: rgba(255,255,255,0.06); 
        transition: transform 0.1s ease-in-out, border 0.1s, box-shadow 0.1s;
        position: relative; 
    }

    .heat-cell:hover { 
        transform: scale(1.6); 
        z-index: 100; 
        border: 1px solid rgba(255,255,255,0.9);
        box-shadow: 0 4px 6px rgba(0,0,0,0.5);
    }

    .heat-cell.is-today {
        border: 1px solid rgba(255,255,255,0.8);
        position: relative;
    }
    .heat-cell.is-today::after {
        content: '';
        position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px;
        border: 1px solid #ff7675;
        border-radius: 3px;
        animation: pulse 2s infinite;
        pointer-events: none;
    }

    @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
    }
    
    .level-0 { background: rgba(255,255,255,0.06); }
    .level-1 { background: rgba(255, 118, 117, 0.3); } 
    .level-2 { background: rgba(255, 118, 117, 0.6); } 
    .level-3 { background: #ff7675; } 
    .level-4 { background: #d63031; } 

    .legend-row { display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 0.7rem; color: rgba(255,255,255,0.5); margin: 10px 0 15px 0; }
    .legend-scale { display: flex; gap: 3px; }

    .stats-summary { display: flex; justify-content: space-between; gap: 5px; }
    .s-item { flex: 1; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 8px; text-align: center; }
    .s-item strong { display: block; font-size: 0.9rem; } .s-item label { font-size: 0.6rem; text-transform: uppercase; opacity: 0.6; }
    
    .flex-box { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .rhythm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .rhythm-header h3 { margin: 0; font-size: 1rem; }
    .legend-mini { font-size: 0.7rem; font-weight: 600; display: flex; gap: 10px; }
    .chart-labels-top { display: flex; justify-content: space-between; padding: 0 10px; margin-bottom: 5px; font-size: 0.65rem; color: rgba(255,255,255,0.5); }
    .chart-wrapper { position: relative; flex: 1; width: 100%; min-height: 60px; }
    .line-chart { width: 100%; height: 100%; overflow: visible; }
    .legend { display: flex; justify-content: center; gap: 10px; margin-top: auto; font-size: 0.75rem; font-weight: 600; padding-top: 5px; }

    /* PRIORITY PERCENTAGE FOOTER */
    .priority-summary {
        display: flex;
        align-items: center;
        justify-content: space-around;
        background: rgba(0,0,0,0.2);
        margin-top: auto; 
        padding: 8px 0;
        border-radius: 8px;
    }
    .p-stat { display: flex; flex-direction: column; align-items: center; line-height: 1; }
    .p-val { font-size: 1.1rem; font-weight: 700; margin-bottom: 2px; }
    .p-lbl { font-size: 0.65rem; text-transform: uppercase; color: rgba(255,255,255,0.5); }
    .p-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }
</style>