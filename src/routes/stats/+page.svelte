<script>
    import { tasks } from '$lib/stores/tasks';
    import { ArrowLeft, CheckCircle, Clock, Flame } from 'lucide-svelte';

    // Derived stats
    $: completedTasks = $tasks.filter(t => t.status === 'review');
    $: totalMinutes = $tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    $: totalHours = (totalMinutes / 60).toFixed(1);
    $: completionRate = $tasks.length ? Math.round((completedTasks.length / $tasks.length) * 100) : 0;
</script>

<div class="stats-container">
    <div class="header">
        <a href="/" class="back-btn"><ArrowLeft /> Back to Board</a>
        <h1>Productivity Insights</h1>
    </div>

    <div class="grid">
        <div class="card highlight">
            <div class="icon"><CheckCircle size={32} /></div>
            <div class="data">
                <span class="num">{completedTasks.length}</span>
                <span class="label">Tasks Completed</span>
            </div>
        </div>

        <div class="card">
            <div class="icon"><Clock size={32} /></div>
            <div class="data">
                <span class="num">{totalHours}h</span>
                <span class="label">Focus Time</span>
            </div>
        </div>

        <div class="card">
            <div class="icon"><Flame size={32} /></div>
            <div class="data">
                <span class="num">{completionRate}%</span>
                <span class="label">Completion Rate</span>
            </div>
        </div>
    </div>

    <div class="history-list">
        <h3>Recent History</h3>
        {#each completedTasks.reverse() as task}
            <div class="history-item">
                <span class="title">{task.title}</span>
                <span class="time">{Math.round(task.timeSpent)}m spent</span>
                <span class="date">{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
        {/each}
        {#if completedTasks.length === 0}
            <p class="empty">No completed tasks yet. Go crush it!</p>
        {/if}
    </div>
</div>

<style>
    .stats-container { max-width: 800px; margin: 0 auto; padding: 40px 20px; color: white; }
    .header { margin-bottom: 40px; }
    .back-btn { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.7); text-decoration: none; margin-bottom: 20px; }
    .back-btn:hover { color: white; }
    
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
    
    .card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 25px; border-radius: 20px; display: flex; align-items: center; gap: 20px; border: 1px solid rgba(255,255,255,0.1); }
    .card.highlight { background: #ba4949; border: none; }
    
    .num { display: block; font-size: 2.5rem; font-weight: 700; line-height: 1; }
    .label { font-size: 0.9rem; opacity: 0.8; }
    
    .history-list { background: rgba(255,255,255,0.05); border-radius: 24px; padding: 30px; }
    .history-item { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .time { color: #aaa; font-size: 0.9rem; }
    .empty { color: rgba(255,255,255,0.3); font-style: italic; }
</style>