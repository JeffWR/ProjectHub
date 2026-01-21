<script>
    import { ChevronDown } from 'lucide-svelte';
    export let archiveList = [];

    let listContainer;
    let isExpanded = false;
    let isClosing = false;

    async function toggleExpand() {
        if (isExpanded) {
            isClosing = true; 
            setTimeout(() => { if (listContainer) listContainer.scrollTo({ top: 0, behavior: 'smooth' }); }, 5);
            setTimeout(() => { isExpanded = false; isClosing = false; }, 100);
        } else {
            isExpanded = true;
        }
    }
</script>

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

<style>
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; flex: 1; display: flex; flex-direction: column; min-height: 200px; }
    .list-container {
        display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow: hidden;
        transition: max-height 0.2s ease-out;
        -webkit-mask-image: linear-gradient(to bottom, black 50%, black 85%, transparent 100%);
        mask-image: linear-gradient(to bottom, black 50%, black 85%, transparent 100%);
    }
    .list-container.scroll-mode { overflow-y: auto; padding-bottom: 20px; scrollbar-width: none; -webkit-mask-position: 0 100%; mask-position: 0 100%; }
    .list-container.closing { -webkit-mask-position: 0 0 !important; mask-position: 0 0 !important; transition: none !important; overflow-y: hidden; }
    .list-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
    .row-main { display: flex; flex-direction: column; gap: 2px; }
    .r-title { font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .r-date { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
    .r-time { font-size: 0.8rem; font-weight: 700; color: #4caf50; background: rgba(76,175,80,0.1); padding: 2px 8px; border-radius: 6px; }
    .expand-btn { margin-top: 10px; width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: none; color: white; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .arrow-wrap { transition: transform 0.2s ease; }
    .flipped { transform: rotate(180deg); }
    .empty { color: rgba(255,255,255,0.3); font-style: italic; text-align: center; margin-top: 20px; }
</style>