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
    <div class="stat-header">
        <h3>History</h3>
        <span class="stat-label">{archiveList.length} completed</span>
    </div>

    <div class="list-container" class:scroll-mode={isExpanded} class:closing={isClosing} bind:this={listContainer}>
        {#each (isExpanded ? archiveList : archiveList.slice(0, 5)) as t (t.id)}
            <div class="stat-list-row">
                <div class="row-main">
                    <span class="r-title">{t.title}</span>
                    <span class="stat-label">{t.dateStr}</span>
                </div>
                <span class="stat-badge green">{Math.floor(t.timeSpent||0)}m</span>
            </div>
        {/each}
        {#if archiveList.length === 0}
            <div class="stat-empty">No completed tasks yet.</div>
        {/if}
    </div>

    {#if archiveList.length > 5}
        <button class="stat-button expand-btn" on:click={toggleExpand}>
            <div class="arrow-wrap" class:flipped={isExpanded}>
                <ChevronDown size={14} />
            </div>
            {isExpanded ? 'Show Less' : 'Show More'}
        </button>
    {/if}
</div>

<style>
    @import '$lib/styles/stats-unified.css';

    .archive-box {
        display: flex;
        flex-direction: column;
        min-height: 0;
        max-height: 380px;
    }

    .list-container {
        display: flex;
        flex-direction: column;
        gap: 0;
        max-height: 240px;
        overflow: hidden;
        transition: max-height 0.2s ease-out;
        -webkit-mask-image: linear-gradient(to bottom, black 50%, black 85%, transparent 100%);
        mask-image: linear-gradient(to bottom, black 50%, black 85%, transparent 100%);
        margin-top: 8px;
        flex: 1;
        min-height: 0;
    }

    .list-container.scroll-mode {
        overflow-y: auto;
        max-height: none;
        padding-bottom: 20px;
        scrollbar-width: none;
        -webkit-mask-position: 0 100%;
        mask-position: 0 100%;
    }

    .list-container.scroll-mode::-webkit-scrollbar {
        display: none;
    }

    .list-container.closing {
        -webkit-mask-position: 0 0 !important;
        mask-position: 0 0 !important;
        transition: none !important;
        overflow-y: hidden;
    }

    .row-main {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;
    }

    .r-title {
        font-size: 0.85rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: rgba(255, 255, 255, 0.9);
    }

    .expand-btn {
        margin-top: 8px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .arrow-wrap {
        display: flex;
        align-items: center;
        transition: transform 0.2s ease;
    }

    .flipped {
        transform: rotate(180deg);
    }
</style>
