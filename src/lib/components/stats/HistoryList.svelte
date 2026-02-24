<script>
    import { onMount, tick } from 'svelte';
    import { ChevronDown } from 'lucide-svelte';
    export let archiveList = [];

    let listContainer;
    let isExpanded = false;
    let isClosing = false;
    let mounted = false;
    let visibleCount = 10; // Default fallback - show more initially

    onMount(async () => {
        setTimeout(() => { mounted = true; }, 50);

        // Calculate how many items fit in the container after a delay
        setTimeout(async () => {
            await tick();
            if (listContainer && archiveList.length > 0) {
                const maxHeight = 400; // Increased max container height
                const firstRow = listContainer.querySelector('.stat-list-row');
                if (firstRow) {
                    const rowHeight = firstRow.offsetHeight;
                    console.log('Row height:', rowHeight, 'Max height:', maxHeight);
                    if (rowHeight > 0) {
                        visibleCount = Math.floor(maxHeight / rowHeight);
                        console.log('Calculated visibleCount:', visibleCount);
                    }
                }
            }
        }, 200);
    });

    $: if (mounted && listContainer && archiveList.length > 0) {
        // Recalculate if archiveList changes
        tick().then(() => {
            const maxHeight = 400;
            const firstRow = listContainer.querySelector('.stat-list-row');
            if (firstRow) {
                const rowHeight = firstRow.offsetHeight;
                if (rowHeight > 0) {
                    const newCount = Math.floor(maxHeight / rowHeight);
                    if (newCount > visibleCount) {
                        visibleCount = newCount;
                    }
                }
            }
        });
    }

    async function toggleExpand() {
        if (isExpanded) {
            // Instantly jump to top
            if (listContainer) listContainer.scrollTop = 0;

            isClosing = true;
            setTimeout(() => { isExpanded = false; isClosing = false; }, 100);
        } else {
            isExpanded = true;
        }
    }
</script>

<div class="stat-box archive-box">
    <div class="stat-header">
        <h3>History</h3>
        <span class="stat-label" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.3s ease">{archiveList.length} completed</span>
    </div>

    <div class="list-container" class:scroll-mode={isExpanded} class:closing={isClosing} bind:this={listContainer}>
        {#each (isExpanded ? archiveList : archiveList.slice(0, visibleCount)) as t, i (t.id)}
            <div class="stat-list-row" style="opacity: {mounted ? 1 : 0}; transition: opacity 0.3s ease {i * 0.08}s">
                <div class="row-main">
                    <span class="r-title">{t.title}</span>
                    <span class="stat-label">{t.dateStr}</span>
                </div>
                <span class="stat-badge green">{Math.floor(t.timeSpent||0)}m</span>
            </div>
        {/each}
        {#if mounted && archiveList.length === 0}
            <div class="stat-empty">No completed tasks yet.</div>
        {/if}
    </div>

    <button class="stat-button expand-btn" on:click={toggleExpand}>
        <div class="arrow-wrap" class:flipped={isExpanded}>
            <ChevronDown size={14} />
        </div>
        {isExpanded ? 'Show Less' : 'Show More'}
    </button>
</div>

<style>
    @import '$lib/styles/stats-unified.css';

    .archive-box {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    .list-container {
        display: flex;
        flex-direction: column;
        gap: 0;
        max-height: 400px;
        overflow: hidden;
        transition: max-height 0.2s ease-out;
        -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 30px), transparent 100%);
        mask-image: linear-gradient(to bottom, black calc(100% - 30px), transparent 100%);
        margin-top: 8px;
    }

    .list-container.scroll-mode {
        overflow-y: auto;
        max-height: none;
        padding-bottom: 20px;
        scrollbar-width: none;
    }

    .list-container.scroll-mode::-webkit-scrollbar {
        display: none;
    }

    .list-container.closing {
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
        color: var(--text-primary);
    }

    .expand-btn {
        margin-top: auto;
        margin-bottom: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex-shrink: 0;
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
