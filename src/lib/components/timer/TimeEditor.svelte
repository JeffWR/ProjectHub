<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { settings } from '$lib/stores/settings';
    import { timer } from '$lib/stores/timer';

    export let initialMinutes = 25;
    
    const dispatch = createEventDispatcher();
    const TICK_WIDTH = 50;
    const MAX_TIME = 120;
    
    let scrollContainer;
    let currentMinutes = initialMinutes;
    let isDragging = false;
    let startX, startScrollLeft;

    // Set initial scroll position
    onMount(() => {
        if (scrollContainer) {
            scrollContainer.scrollLeft = (initialMinutes - 1) * TICK_WIDTH;
        }
    });

    function handleScroll() {
        if (!scrollContainer) return;
        let rawValue = Math.round(scrollContainer.scrollLeft / TICK_WIDTH) + 1;
        currentMinutes = Math.max(1, Math.min(MAX_TIME, rawValue));
    }

    function save() {
        timer.setDuration(currentMinutes);
        settings.update(s => {
            const newS = { ...s };
            if ($timer.mode === 'pomodoro') newS.pomodoro = currentMinutes;
            if ($timer.mode === 'short') newS.shortBreak = currentMinutes;
            if ($timer.mode === 'long') newS.longBreak = currentMinutes;
            return newS;
        });
        dispatch('close');
    }

    // Drag Logic
    function onMouseDown(e) { 
        if (e.target.closest('button')) return; 
        isDragging = true; 
        startX = e.pageX; 
        startScrollLeft = scrollContainer.scrollLeft; 
        scrollContainer.style.scrollSnapType = 'none'; 
        document.body.style.cursor = 'grabbing'; 
    }
    
    function onMouseUp() { 
        isDragging = false; 
        if(scrollContainer) scrollContainer.style.scrollSnapType = 'x mandatory'; 
        document.body.style.cursor = 'default'; 
    }
    
    function onMouseMove(e) { 
        if (!isDragging) return; 
        e.preventDefault(); 
        const x = e.pageX; 
        const walk = (x - startX) * 1.5; 
        scrollContainer.scrollLeft = startScrollLeft - walk; 
    }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div class="fullscreen-overlay" transition:fade={{ duration: 200 }}>
    <div class="overlay-content">
        <div class="edit-readout">
            <span class="val">{currentMinutes}</span><span class="lbl">min</span>
        </div>
        
        <div class="ruler-container">
            <div class="center-line"></div>
            <div 
                class="scroll-track" 
                bind:this={scrollContainer} 
                on:scroll={handleScroll}
                on:mousedown={onMouseDown}
            >
                <div class="spacer" style="flex: 0 0 calc(50% - {TICK_WIDTH / 2}px);"></div>
                {#each Array(MAX_TIME) as _, i}
                    <div class="tick-group" style="width: {TICK_WIDTH}px">
                        {#if (i + 1) % 5 === 0}
                            <div class="tick major"></div><span class="tick-label">{i + 1}</span>
                        {:else}
                            <div class="tick minor"></div>
                        {/if}
                    </div>
                {/each}
                <div class="spacer" style="flex: 0 0 calc(50% - {TICK_WIDTH / 2}px);"></div>
            </div>
        </div>

        <button class="save-btn" on:click={save}>SET TIME</button>
    </div>
</div>

<style>
    .fullscreen-overlay { position: fixed; inset: 0; background: rgba(15, 15, 15, 0.9); backdrop-filter: blur(20px); z-index: 9999; display: flex; justify-content: center; align-items: center; }
    .overlay-content { width: 100%; display: flex; flex-direction: column; align-items: center; }
    .edit-readout { margin-bottom: 40px; color: white; line-height: 1; }
    .edit-readout .val { font-size: 8rem; font-weight: 800; }
    .edit-readout .lbl { font-size: 2rem; font-weight: 500; opacity: 0.8; margin-left: 10px; }
    .ruler-container { position: relative; width: 100%; height: 160px; mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent); }
    .center-line { position: absolute; left: 50%; bottom: 0; width: 4px; height: 70px; background: #ff7675; border-radius: 2px; transform: translateX(-50%); z-index: 10; pointer-events: none; box-shadow: 0 0 15px #ff7675; }
    .scroll-track { display: flex; align-items: flex-end; overflow-x: auto; height: 100%; width: 100%; scroll-snap-type: x mandatory; scrollbar-width: none; cursor: grab; }
    .scroll-track::-webkit-scrollbar { display: none; }
    .tick-group { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; scroll-snap-align: center; }
    .tick { background: rgba(255,255,255,0.4); border-radius: 2px; }
    .tick.major { width: 4px; height: 50px; background: white; margin-bottom: 10px; }
    .tick.minor { width: 2px; height: 20px; margin-bottom: 10px; opacity: 0.5; }
    .tick-label { position: absolute; top: 30px; font-size: 1.1rem; font-weight: 700; color: white; }
    .save-btn { margin-top: 50px; background: white; color: #ba4949; border: none; padding: 15px 50px; border-radius: 50px; font-weight: 800; font-size: 1.2rem; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: transform 0.1s; }
</style>