<script>
	import { tasks, addTask, moveTask } from '$lib/stores/tasks';
	import TaskItem from '$lib/components/TaskItem.svelte';
	import TaskModal from '$lib/components/TaskModal.svelte';
	import TaskDetailModal from '$lib/components/TaskDetailModal.svelte';
	import { Plus, LayoutList } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	let showModal = false;
	let selectedTask = null;

	// Mobile tab switcher
	let mobileTab = 'todo'; // 'todo' | 'focus' | 'review'

	// Prevent hydration flash and trigger staggered animation
	let hydrated = false;
	onMount(() => {
		requestAnimationFrame(() => {
			hydrated = true;
		});
	});

	$: todoTasks = $tasks.filter((t) => t.status === 'todo');
	$: progressTasks = $tasks.filter((t) => t.status === 'inprogress');
	$: reviewTasks = $tasks.filter((t) => t.status === 'review');

	function handleCreate(data) {
		addTask(data);
		showModal = false;
	}

	function openTaskDetail(task) {
		selectedTask = task;
	}

	// ─────────────────────────────────────────────
	//  DESKTOP: HTML5 Drag & Drop
	// ─────────────────────────────────────────────
	let draggedTaskId = null;
	let dropTargetInfo = null;
	let autoScrollInterval = null;
	let lastMouseX = 0;
	let lastMouseY = 0;
	let draggedTaskHeight = 80;

	function handleDragStart(event, id) {
		event.dataTransfer.setData('text/plain', id);
		event.dataTransfer.effectAllowed = 'move';
		draggedTaskId = id;

		const dragElement = event.currentTarget;
		draggedTaskHeight = dragElement.offsetHeight;

		const rect = dragElement.getBoundingClientRect();
		const offsetX = event.clientX - rect.left + 30;
		const offsetY = event.clientY - rect.top + 30;

		const wrapper = document.createElement('div');
		wrapper.style.position = 'absolute';
		wrapper.style.top = '-9999px';
		wrapper.style.left = '-9999px';
		wrapper.style.padding = '30px';
		wrapper.style.overflow = 'visible';
		wrapper.style.pointerEvents = 'none';

		const clone = dragElement.cloneNode(true);
		clone.style.transform = 'rotate(5deg)';
		clone.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
		clone.style.width = dragElement.offsetWidth + 'px';
		clone.style.opacity = '0.9';

		wrapper.appendChild(clone);
		document.body.appendChild(wrapper);
		event.dataTransfer.setDragImage(wrapper, offsetX, offsetY);

		setTimeout(() => {
			if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
		}, 0);

		startAutoScroll();
	}

	function handleDragEnd() {
		draggedTaskId = null;
		dropTargetInfo = null;
		stopAutoScroll();
	}

	function startAutoScroll() {
		document.addEventListener('dragover', trackMousePosition);
		autoScrollInterval = setInterval(() => {
			if (!draggedTaskId) return;
			const el = document.elementFromPoint(lastMouseX, lastMouseY);
			if (!el) return;
			const scrollArea = el.closest('.scroll-area');
			if (!scrollArea) return;
			const rect = scrollArea.getBoundingClientRect();
			const zone = 80;
			const speed = 10;
			if (lastMouseY - rect.top < zone && lastMouseY > rect.top) scrollArea.scrollTop -= speed;
			else if (rect.bottom - lastMouseY < zone && lastMouseY < rect.bottom)
				scrollArea.scrollTop += speed;
		}, 50);
	}

	function stopAutoScroll() {
		document.removeEventListener('dragover', trackMousePosition);
		if (autoScrollInterval) {
			clearInterval(autoScrollInterval);
			autoScrollInterval = null;
		}
	}

	function trackMousePosition(event) {
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
	}

	function handleDragOver(event, task) {
		event.preventDefault();
		event.stopPropagation();
		if (!draggedTaskId || draggedTaskId === task.id) {
			dropTargetInfo = null;
			return;
		}
		const rect = event.currentTarget.getBoundingClientRect();
		const insertBefore = event.clientY < rect.top + rect.height / 2;
		dropTargetInfo = { taskId: task.id, insertBefore };
	}

	function handleZoneDrop(event, newStatus) {
		event.preventDefault();
		const id = event.dataTransfer.getData('text/plain');
		if (!id) return;
		if (dropTargetInfo?.taskId) {
			const targetTask = $tasks.find((t) => t.id === dropTargetInfo.taskId);
			if (targetTask && targetTask.status === newStatus) {
				handleTaskDrop(
					{
						preventDefault: () => {},
						stopPropagation: () => {},
						dataTransfer: event.dataTransfer
					},
					targetTask
				);
				return;
			}
		}
		moveTask(id, newStatus);
		dropTargetInfo = null;
	}

	function handleTaskDrop(event, targetTask) {
		event.preventDefault();
		event.stopPropagation();
		const draggedId = event.dataTransfer.getData('text/plain');
		if (!draggedId || draggedId === targetTask.id) {
			dropTargetInfo = null;
			return;
		}
		const draggedTask = $tasks.find((t) => t.id === draggedId);
		if (!draggedTask) {
			dropTargetInfo = null;
			return;
		}
		if (!dropTargetInfo || dropTargetInfo.taskId !== targetTask.id) {
			dropTargetInfo = { taskId: targetTask.id, insertBefore: false };
		}
		const targetIndex = $tasks.findIndex((t) => t.id === targetTask.id);
		const draggedIndex = $tasks.findIndex((t) => t.id === draggedId);
		let insertIndex;
		if (dropTargetInfo.insertBefore) {
			insertIndex = targetIndex;
			if (draggedIndex < targetIndex) insertIndex--;
		} else {
			insertIndex = targetIndex + 1;
			if (draggedIndex < targetIndex) insertIndex--;
		}
		moveTask(draggedId, targetTask.status, insertIndex);
		dropTargetInfo = null;
	}

	// ─────────────────────────────────────────────
	//  MOBILE: Touch Drag & Drop
	// ─────────────────────────────────────────────
	let touchDragId = null;
	let touchClone = null;
	let touchStartX = 0;
	let touchStartY = 0;
	let touchOffsetX = 0;
	let touchOffsetY = 0;
	let touchDropColumn = null; // 'todo' | 'inprogress' | 'review'
	let touchDropTargetId = null;
	let touchInsertBefore = false;
	let touchAutoScrollInterval = null;
	let touchLastY = 0;

	// Which column the dragged task lives in — used to derive the two drop zones
	let touchDragSourceColumn = null;
	// Which drop zone is currently highlighted ('todo'|'inprogress'|'review'|null)
	let touchHoveredZone = null;
	// Svelte-reactive flag — true while a touch clone is live
	let isTouchDragging = false;

	function isMobile() {
		return window.innerWidth <= 768;
	}

	function onTouchDragStart(e, taskId) {
		// Only activate touch drag on mobile
		if (!isMobile()) return;

		// If it's a tap (not a hold), let it fall through to click
		// We start the drag on touchstart but only commit after a small move threshold
		touchDragId = taskId;
		const touch = e.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		touchLastY = touch.clientY;

		// Remember which column this task comes from
		const task = $tasks.find((t) => t.id === taskId);
		touchDragSourceColumn = task ? task.status : null;
	}

	function onTouchDragMove(e, taskId) {
		if (touchDragId !== taskId) return;

		const touch = e.touches[0];
		const dx = touch.clientX - touchStartX;
		const dy = touch.clientY - touchStartY;

		// Only start visual drag after moving 8px (distinguish tap from drag)
		if (!touchClone && Math.sqrt(dx * dx + dy * dy) < 8) return;

		// Prevent page scroll while dragging a card
		e.preventDefault();

		touchLastY = touch.clientY;

		// Create clone on first real move
		if (!touchClone) {
			const el = e.currentTarget;
			const rect = el.getBoundingClientRect();
			touchOffsetX = touch.clientX - rect.left;
			touchOffsetY = touch.clientY - rect.top;

			touchClone = el.cloneNode(true);
			touchClone.style.position = 'fixed';
			touchClone.style.zIndex = '9999';
			touchClone.style.width = rect.width + 'px';
			touchClone.style.pointerEvents = 'none';
			touchClone.style.opacity = '0.85';
			touchClone.style.transform = 'rotate(3deg) scale(1.03)';
			touchClone.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
			touchClone.style.borderRadius = '16px';
			touchClone.style.transition = 'none';
			touchClone.style.left = touch.clientX - touchOffsetX + 'px';
			touchClone.style.top = touch.clientY - touchOffsetY + 'px';
			document.body.appendChild(touchClone);

			isTouchDragging = true;
			startTouchAutoScroll();
		} else {
			touchClone.style.left = touch.clientX - touchOffsetX + 'px';
			touchClone.style.top = touch.clientY - touchOffsetY + 'px';
		}

		// Determine which column and task the finger is over
		touchClone.style.display = 'none';
		const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
		touchClone.style.display = '';

		// Check if finger is over one of the floating drop zones
		const zoneEl = elBelow ? elBelow.closest('[data-drop-zone]') : null;
		if (zoneEl) {
			touchHoveredZone = zoneEl.dataset.dropZone;
			touchDropColumn = touchHoveredZone;
			touchDropTargetId = null;
			touchInsertBefore = false;
		} else {
			touchHoveredZone = null;

			if (elBelow) {
				// Which column?
				const colEl = elBelow.closest('[data-column]');
				touchDropColumn = colEl ? colEl.dataset.column : null;

				// Which task card?
				const cardEl = elBelow.closest('[data-task-id]');
				if (cardEl && cardEl.dataset.taskId !== taskId) {
					const rect = cardEl.getBoundingClientRect();
					touchDropTargetId = cardEl.dataset.taskId;
					touchInsertBefore = touch.clientY < rect.top + rect.height / 2;
				} else {
					touchDropTargetId = null;
					touchInsertBefore = false;
				}
			}
		}
	}

	function onTouchDragEnd(e, taskId) {
		if (touchDragId !== taskId) return;

		stopTouchAutoScroll();

		if (touchClone) {
			document.body.removeChild(touchClone);
			touchClone = null;
			isTouchDragging = false;

			// Commit the drop
			if (touchDropColumn) {
				if (touchDropTargetId) {
					const targetTask = $tasks.find((t) => t.id === touchDropTargetId);
					if (targetTask) {
						const targetIndex = $tasks.findIndex((t) => t.id === touchDropTargetId);
						const draggedIndex = $tasks.findIndex((t) => t.id === taskId);
						let insertIndex;
						if (touchInsertBefore) {
							insertIndex = targetIndex;
							if (draggedIndex < targetIndex) insertIndex--;
						} else {
							insertIndex = targetIndex + 1;
							if (draggedIndex < targetIndex) insertIndex--;
						}
						moveTask(taskId, targetTask.status, insertIndex);
					}
				} else {
					// Dropped on floating zone or empty column area
					moveTask(taskId, touchDropColumn);
				}
			}
		}
		// else: it was just a tap — let the click handler fire

		touchDragId = null;
		touchDropColumn = null;
		touchDropTargetId = null;
		touchInsertBefore = false;
		touchDragSourceColumn = null;
		touchHoveredZone = null;
		isTouchDragging = false;
	}

	// Derive the two target drop zones for the currently dragged task
	$: touchDropZones = (() => {
		if (!touchDragSourceColumn) return [];
		const all = [
			{ status: 'todo', label: 'To Do', icon: '📋' },
			{ status: 'inprogress', label: 'In Focus', icon: '🎯' },
			{ status: 'review', label: 'Review', icon: '✅' }
		];
		return all.filter((z) => z.status !== touchDragSourceColumn);
	})();

	function startTouchAutoScroll() {
		touchAutoScrollInterval = setInterval(() => {
			if (!touchClone) return;
			const el = document.elementFromPoint(
				parseFloat(touchClone.style.left) + parseFloat(touchClone.style.width) / 2,
				touchLastY
			);
			if (!el) return;
			const scrollArea = el.closest('.scroll-area');
			if (!scrollArea) return;
			const rect = scrollArea.getBoundingClientRect();
			const zone = 80;
			const speed = 8;
			if (touchLastY - rect.top < zone) scrollArea.scrollTop -= speed;
			else if (rect.bottom - touchLastY < zone) scrollArea.scrollTop += speed;
		}, 50);
	}

	function stopTouchAutoScroll() {
		if (touchAutoScrollInterval) {
			clearInterval(touchAutoScrollInterval);
			touchAutoScrollInterval = null;
		}
	}

	// ─────────────────────────────────────────────
	//  MOBILE: Swipe-to-reveal action buttons
	// ─────────────────────────────────────────────
	// swipeState[taskId] = { x: number, swiping: boolean }
	let swipeState = {};
	let swipeStartX = {};
	let swipeStartY = {};
	let swipeActive = {}; // true once we've confirmed horizontal swipe
	const SWIPE_THRESHOLD = 60; // px to reveal actions
	const SWIPE_MAX = 160; // max reveal width

	function onSwipeTouchStart(e, taskId) {
		if (!isMobile()) return;
		const t = e.touches[0];
		swipeStartX[taskId] = t.clientX;
		swipeStartY[taskId] = t.clientY;
		swipeActive[taskId] = false;
	}

	function onSwipeTouchMove(e, taskId) {
		if (!isMobile()) return;
		const t = e.touches[0];
		const dx = t.clientX - swipeStartX[taskId];
		const dy = t.clientY - swipeStartY[taskId];

		// Confirm horizontal swipe (more X than Y movement)
		if (!swipeActive[taskId]) {
			if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
			if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll wins
			swipeActive[taskId] = true;
		}

		// Only allow left swipe (negative dx)
		if (dx > 0) {
			// Swiping right: close if open
			swipeState = { ...swipeState, [taskId]: 0 };
			return;
		}

		e.preventDefault(); // prevent scroll while swiping card
		const clamped = Math.min(Math.abs(dx), SWIPE_MAX);
		swipeState = { ...swipeState, [taskId]: clamped };
	}

	function onSwipeTouchEnd(e, taskId) {
		if (!isMobile()) return;
		const current = swipeState[taskId] || 0;
		if (current >= SWIPE_THRESHOLD) {
			// Snap open
			swipeState = { ...swipeState, [taskId]: SWIPE_MAX };
		} else {
			// Snap closed
			swipeState = { ...swipeState, [taskId]: 0 };
		}
		swipeActive[taskId] = false;
	}

	function closeSwipe(taskId) {
		swipeState = { ...swipeState, [taskId]: 0 };
	}

	function closeAllSwipes(exceptId = null) {
		const next = {};
		for (const id of Object.keys(swipeState)) {
			next[id] = id === exceptId ? swipeState[id] : 0;
		}
		swipeState = next;
	}

	// Move task and close swipe
	function swipeMove(taskId, newStatus) {
		closeSwipe(taskId);
		setTimeout(() => moveTask(taskId, newStatus), 200);
	}

	// Actions available per status
	function swipeActions(task) {
		if (task.status === 'todo') {
			return [{ label: 'In Focus', status: 'inprogress', color: '#4caf50' }];
		}
		if (task.status === 'inprogress') {
			return [
				{ label: 'To Do', status: 'todo', color: '#fdcb6e' },
				{ label: 'Review', status: 'review', color: '#74b9ff' }
			];
		}
		if (task.status === 'review') {
			return [{ label: 'To Do', status: 'todo', color: '#fdcb6e' }];
		}
		return [];
	}
</script>

<TaskModal isOpen={showModal} onClose={() => (showModal = false)} onSave={handleCreate} />

{#if selectedTask}
	<TaskDetailModal task={selectedTask} on:close={() => (selectedTask = null)} />
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="grid-container" on:click={() => closeAllSwipes()}>
	<!-- Mobile-only tab switcher -->
	<div class="mobile-tabs">
		<button
			class="mobile-tab-btn"
			class:active={mobileTab === 'todo'}
			on:click|stopPropagation={() => (mobileTab = 'todo')}
		>
			To Do <span class="mobile-tab-badge">{todoTasks.length}</span>
		</button>
		<button
			class="mobile-tab-btn"
			class:active={mobileTab === 'focus'}
			on:click|stopPropagation={() => (mobileTab = 'focus')}
		>
			In Focus <span class="mobile-tab-badge">{progressTasks.length}</span>
		</button>
		<button
			class="mobile-tab-btn"
			class:active={mobileTab === 'review'}
			on:click|stopPropagation={() => (mobileTab = 'review')}
		>
			Review <span class="mobile-tab-badge">{reviewTasks.length}</span>
		</button>
	</div>

	<!-- ── LEFT COL: To Do ── -->
	<div class="col-left" class:mobile-active={mobileTab === 'todo'}>
		<div class="create-section">
			<button class="big-create-btn" on:click|stopPropagation={() => (showModal = true)}>
				<div class="icon-circle"><Plus size={32} /></div>
				<span>Create New Task</span>
			</button>
		</div>

		<div
			class="section list-section"
			role="list"
			data-column="todo"
			on:drop={(e) => handleZoneDrop(e, 'todo')}
			on:dragover|preventDefault
		>
			<div class="header">
				<h3>To Do</h3>
				<span class="badge" style="opacity: {hydrated ? 1 : 0}; transition: opacity 0.3s ease"
					>{todoTasks.length}</span
				>
			</div>
			<div class="scroll-area">
				{#each todoTasks as task, index (task.id)}
					{#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
						<div
							class="drop-placeholder"
							style="height: {draggedTaskHeight}px"
							on:drop={(e) => handleTaskDrop(e, task)}
							on:dragover|preventDefault
						>
							Drop here
						</div>
					{/if}

					<!-- Swipe wrapper -->
					<div
						class="swipe-row"
						style="opacity: {hydrated ? 1 : 0}; transform: translateY({hydrated ? 0 : 20}px);
							   transition: opacity 0.6s ease-out {index * 0.12}s, transform 0.6s ease-out {index * 0.12}s"
					>
						<!-- Actions revealed on swipe -->
						<div class="swipe-actions" style="width: {swipeState[task.id] || 0}px">
							{#each swipeActions(task) as action}
								<button
									class="swipe-action-btn"
									style="background: {action.color}"
									on:click|stopPropagation={() => swipeMove(task.id, action.status)}
								>
									{action.label}
								</button>
							{/each}
						</div>

						<!-- Card with unified touch handling -->
						<div
							class="card-wrapper"
							data-task-id={task.id}
							draggable="true"
							class:being-dragged={draggedTaskId === task.id}
							class:touch-dragging={touchDragId === task.id && touchClone}
							style="transform: translateX(-{swipeState[task.id] || 0}px)"
							on:dragstart={(e) => handleDragStart(e, task.id)}
							on:dragend={handleDragEnd}
							on:dragover={(e) => handleDragOver(e, task)}
							on:drop={(e) => handleTaskDrop(e, task)}
							on:touchstart={(e) => {
								closeAllSwipes(task.id);
								onSwipeTouchStart(e, task.id);
								onTouchDragStart(e, task.id);
							}}
							on:touchmove={(e) => {
								// Only one gesture at a time
								if (touchClone || (touchDragId === task.id && !swipeActive[task.id])) {
									onTouchDragMove(e, task.id);
								} else {
									onSwipeTouchMove(e, task.id);
								}
							}}
							on:touchend={(e) => {
								if (touchClone || (touchDragId === task.id && touchClone)) {
									onTouchDragEnd(e, task.id);
								} else {
									onSwipeTouchEnd(e, task.id);
									// Tap with no swipe = open detail
									if (!swipeActive[task.id] && (swipeState[task.id] || 0) < 10) {
										openTaskDetail(task);
									}
									touchDragId = null;
								}
							}}
							on:click={() => {
								// Desktop double-click handled separately; single click on mobile already done via touchend
								if (!isMobile()) return;
							}}
							on:dblclick={() => openTaskDetail(task)}
							role="listitem"
							title="Swipe left for actions · Double-click to edit"
						>
							<TaskItem {task} />
						</div>
					</div>

					{#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
						<div
							class="drop-placeholder"
							style="height: {draggedTaskHeight}px"
							on:drop={(e) => handleTaskDrop(e, task)}
							on:dragover|preventDefault
						>
							Drop here
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- ── MID COL: In Focus ── -->
	<div
		class="col-mid section"
		class:mobile-active={mobileTab === 'focus'}
		role="list"
		data-column="inprogress"
		on:drop={(e) => handleZoneDrop(e, 'inprogress')}
		on:dragover|preventDefault
	>
		<div class="header highlight">
			<h3>In Focus</h3>
			<span class="badge" style="opacity: {hydrated ? 1 : 0}; transition: opacity 0.3s ease"
				>{progressTasks.length}</span
			>
		</div>
		<div class="scroll-area">
			{#each progressTasks as task, index (task.id)}
				{#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
					<div
						class="drop-placeholder"
						style="height: {draggedTaskHeight}px"
						on:drop={(e) => handleTaskDrop(e, task)}
						on:dragover|preventDefault
					>
						Drop here
					</div>
				{/if}

				<div
					class="swipe-row"
					style="opacity: {hydrated ? 1 : 0}; transform: translateY({hydrated ? 0 : 20}px);
						   transition: opacity 0.6s ease-out {index * 0.12}s, transform 0.6s ease-out {index * 0.12}s"
				>
					<div class="swipe-actions" style="width: {swipeState[task.id] || 0}px">
						{#each swipeActions(task) as action}
							<button
								class="swipe-action-btn"
								style="background: {action.color}"
								on:click|stopPropagation={() => swipeMove(task.id, action.status)}
							>
								{action.label}
							</button>
						{/each}
					</div>

					<div
						class="card-wrapper"
						data-task-id={task.id}
						draggable="true"
						class:being-dragged={draggedTaskId === task.id}
						class:touch-dragging={touchDragId === task.id && touchClone}
						style="transform: translateX(-{swipeState[task.id] || 0}px)"
						on:dragstart={(e) => handleDragStart(e, task.id)}
						on:dragend={handleDragEnd}
						on:dragover={(e) => handleDragOver(e, task)}
						on:drop={(e) => handleTaskDrop(e, task)}
						on:touchstart={(e) => {
							closeAllSwipes(task.id);
							onSwipeTouchStart(e, task.id);
							onTouchDragStart(e, task.id);
						}}
						on:touchmove={(e) => {
							if (touchClone || (touchDragId === task.id && !swipeActive[task.id])) {
								onTouchDragMove(e, task.id);
							} else {
								onSwipeTouchMove(e, task.id);
							}
						}}
						on:touchend={(e) => {
							if (touchClone || (touchDragId === task.id && touchClone)) {
								onTouchDragEnd(e, task.id);
							} else {
								onSwipeTouchEnd(e, task.id);
								if (!swipeActive[task.id] && (swipeState[task.id] || 0) < 10) {
									openTaskDetail(task);
								}
								touchDragId = null;
							}
						}}
						on:dblclick={() => openTaskDetail(task)}
						role="listitem"
						title="Swipe left for actions · Double-click to edit"
					>
						<TaskItem {task} showProgress={true} isHero={index === 0} />
					</div>
				</div>

				{#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
					<div
						class="drop-placeholder"
						style="height: {draggedTaskHeight}px"
						on:drop={(e) => handleTaskDrop(e, task)}
						on:dragover|preventDefault
					>
						Drop here
					</div>
				{/if}
			{/each}

			{#if hydrated && progressTasks.length === 0}
				<div class="empty-placeholder">
					<span class="empty-icon">🎯</span>
					<span>Drag a task here<br /><small>or swipe left on a task</small></span>
				</div>
			{/if}
		</div>
	</div>

	<!-- ── RIGHT COL: Review ── -->
	<div class="col-right" class:mobile-active={mobileTab === 'review'}>
		<div
			class="section review-section"
			role="list"
			data-column="review"
			on:drop={(e) => handleZoneDrop(e, 'review')}
			on:dragover|preventDefault
		>
			<div class="header">
				<h3>Review</h3>
				<span class="badge" style="opacity: {hydrated ? 1 : 0}; transition: opacity 0.3s ease"
					>{reviewTasks.length}</span
				>
			</div>
			<div class="scroll-area">
				{#each reviewTasks as task, index (task.id)}
					{#if dropTargetInfo?.taskId === task.id && dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
						<div
							class="drop-placeholder"
							style="height: {draggedTaskHeight}px"
							on:drop={(e) => handleTaskDrop(e, task)}
							on:dragover|preventDefault
						>
							Drop here
						</div>
					{/if}

					<div
						class="swipe-row"
						style="opacity: {hydrated ? 1 : 0}; transform: translateY({hydrated ? 0 : 20}px);
							   transition: opacity 0.6s ease-out {index * 0.12}s, transform 0.6s ease-out {index * 0.12}s"
					>
						<div class="swipe-actions" style="width: {swipeState[task.id] || 0}px">
							{#each swipeActions(task) as action}
								<button
									class="swipe-action-btn"
									style="background: {action.color}"
									on:click|stopPropagation={() => swipeMove(task.id, action.status)}
								>
									{action.label}
								</button>
							{/each}
						</div>

						<div
							class="card-wrapper"
							data-task-id={task.id}
							draggable="true"
							class:being-dragged={draggedTaskId === task.id}
							class:touch-dragging={touchDragId === task.id && touchClone}
							style="transform: translateX(-{swipeState[task.id] || 0}px)"
							on:dragstart={(e) => handleDragStart(e, task.id)}
							on:dragend={handleDragEnd}
							on:dragover={(e) => handleDragOver(e, task)}
							on:drop={(e) => handleTaskDrop(e, task)}
							on:touchstart={(e) => {
								closeAllSwipes(task.id);
								onSwipeTouchStart(e, task.id);
								onTouchDragStart(e, task.id);
							}}
							on:touchmove={(e) => {
								if (touchClone || (touchDragId === task.id && !swipeActive[task.id])) {
									onTouchDragMove(e, task.id);
								} else {
									onSwipeTouchMove(e, task.id);
								}
							}}
							on:touchend={(e) => {
								if (touchClone || (touchDragId === task.id && touchClone)) {
									onTouchDragEnd(e, task.id);
								} else {
									onSwipeTouchEnd(e, task.id);
									if (!swipeActive[task.id] && (swipeState[task.id] || 0) < 10) {
										openTaskDetail(task);
									}
									touchDragId = null;
								}
							}}
							on:dblclick={() => openTaskDetail(task)}
							role="listitem"
							title="Swipe left for actions · Double-click to edit"
						>
							<TaskItem {task} />
						</div>
					</div>

					{#if dropTargetInfo?.taskId === task.id && !dropTargetInfo?.insertBefore && draggedTaskId !== task.id}
						<div
							class="drop-placeholder"
							style="height: {draggedTaskHeight}px"
							on:drop={(e) => handleTaskDrop(e, task)}
							on:dragover|preventDefault
						>
							Drop here
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<div class="section history-link-section">
			<a href="/stats" class="history-card">
				<div class="icon"><LayoutList size={24} /></div>
				<div><strong>Completed</strong><small>View History</small></div>
			</a>
		</div>
	</div>
</div>

<!-- ── MOBILE FLOATING DROP ZONES (shown while touch-dragging) ── -->
{#if isTouchDragging && touchDropZones.length > 0}
	<div
		class="touch-drop-overlay"
		in:fly={{ y: 40, duration: 220 }}
		out:fly={{ y: 40, duration: 160 }}
	>
		{#each touchDropZones as zone}
			<div
				class="touch-drop-zone"
				class:hovered={touchHoveredZone === zone.status}
				data-drop-zone={zone.status}
			>
				<span class="tdz-icon">{zone.icon}</span>
				<span class="tdz-label">{zone.label}</span>
				{#if touchHoveredZone === zone.status}
					<span class="tdz-release">Release to move</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	/* Hide mobile-only elements on desktop */
	.mobile-tabs {
		display: none;
	}

	/* MAIN LAYOUT */
	.grid-container {
		display: grid;
		grid-template-columns: 1fr 1.5fr 1fr;
		gap: 20px;
		width: 100%;
		max-width: 1400px;
		height: 85vh;
		padding: 20px;
		box-sizing: border-box;
	}

	.col-left,
	.col-right {
		display: flex;
		flex-direction: column;
		gap: 20px;
		height: 100%;
		min-height: 0;
	}

	/* SECTIONS */
	.section {
		background: var(--surface);
		backdrop-filter: blur(10px);
		border: 1px solid var(--border);
		border-radius: 24px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;
		min-width: 0;
		box-shadow: var(--shadow);
		transition:
			background 0.2s,
			box-shadow 0.2s;
	}
	.section:hover {
		background: var(--surface-hover);
		border-color: var(--border-strong);
	}

	.list-section,
	.col-mid,
	.review-section {
		flex: 1;
		min-height: 0;
	}

	/* SCROLL AREA */
	.scroll-area {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: none;
		-ms-overflow-style: none;
		-webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
		mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
		padding: 20px;
		padding-bottom: 40px;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
	.scroll-area::-webkit-scrollbar {
		display: none;
	}

	/* HEADERS & BUTTONS */
	.create-section {
		flex: 0 0 auto;
	}
	.big-create-btn {
		width: 100%;
		height: 100px;
		background: var(--surface);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 24px;
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 0 30px;
		font-family: 'Poppins', sans-serif;
		font-size: 1.2rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: var(--shadow);
		transition: 0.2s;
	}
	.big-create-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
	}
	.icon-circle {
		background: var(--color-primary);
		color: white;
		padding: 10px;
		border-radius: 50%;
		display: flex;
	}

	.header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 15px;
		flex-shrink: 0;
	}
	.header h3 {
		margin: 0;
		font-size: 1.1rem;
		color: var(--text-secondary);
	}
	.header.highlight h3 {
		color: var(--text-primary);
		font-size: 1.4rem;
		font-weight: 700;
	}
	.badge {
		background: var(--surface);
		border: 1px solid var(--border);
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 0.8rem;
		color: var(--text-secondary);
	}
	.empty-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		text-align: center;
		opacity: 0.5;
		margin-top: 50px;
		color: var(--text-primary);
		font-size: 0.9rem;
		line-height: 1.5;
	}
	.empty-icon {
		font-size: 2rem;
	}

	.history-link-section {
		flex: 0 0 100px;
		padding: 0;
		background: var(--surface);
		border: 1px solid var(--border);
	}
	.history-card {
		display: flex;
		align-items: center;
		gap: 15px;
		width: 100%;
		height: 100%;
		text-decoration: none;
		color: var(--text-primary);
		padding: 0 25px;
		box-sizing: border-box;
	}

	/* DRAG & DROP */
	.being-dragged {
		opacity: 0.4;
		transform: scale(0.95);
		transition:
			opacity 0.2s,
			transform 0.2s;
	}
	.touch-dragging {
		opacity: 0.3;
	}

	.drop-placeholder {
		min-height: 60px;
		background: rgba(255, 118, 117, 0.15);
		border: 2px dashed rgba(255, 118, 117, 0.5);
		border-radius: 12px;
		margin: 8px 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 118, 117, 0.8);
		font-size: 0.9rem;
		font-weight: 600;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			background: rgba(255, 118, 117, 0.15);
			border-color: rgba(255, 118, 117, 0.5);
		}
		50% {
			background: rgba(255, 118, 117, 0.25);
			border-color: rgba(255, 118, 117, 0.7);
		}
	}

	[draggable='true'] {
		cursor: grab;
	}
	[draggable='true']:active {
		cursor: grabbing;
	}

	/* SWIPE ROW */
	.swipe-row {
		position: relative;
		display: flex;
		align-items: stretch;
		border-radius: 16px;
		overflow: hidden;
	}

	.swipe-actions {
		/* Sits behind the card, revealed as card slides left */
		flex-shrink: 0;
		display: flex;
		align-items: stretch;
		overflow: hidden;
		transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 16px 0 0 16px;
	}

	.swipe-action-btn {
		flex: 1;
		min-width: 70px;
		border: none;
		color: white;
		font-family: 'Poppins', sans-serif;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		cursor: pointer;
		padding: 0 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: filter 0.15s;
		white-space: nowrap;
	}
	.swipe-action-btn:active {
		filter: brightness(0.85);
	}

	.card-wrapper {
		flex: 1;
		min-width: 0;
		transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
		/* Clip the card corners where the swipe actions are revealed */
		border-radius: 16px;
	}

	/* ── MOBILE STYLES ── */
	@media (max-width: 768px) {
		.grid-container {
			display: flex;
			flex-direction: column;
			height: auto;
			min-height: calc(100vh - 65px);
			padding: 12px;
			gap: 0;
			width: 100%;
			box-sizing: border-box;
		}

		.mobile-tabs {
			display: flex;
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 4px;
			gap: 4px;
			margin-bottom: 12px;
			flex-shrink: 0;
		}

		.mobile-tab-btn {
			flex: 1;
			background: transparent;
			border: none;
			color: var(--text-muted);
			padding: 8px 4px;
			border-radius: 12px;
			font-family: 'Poppins', sans-serif;
			font-size: 0.78rem;
			font-weight: 600;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 5px;
			transition: 0.2s;
		}

		.mobile-tab-btn.active {
			background: var(--surface-hover);
			color: var(--text-primary);
		}

		.mobile-tab-badge {
			background: var(--surface-hover);
			border-radius: 999px;
			font-size: 0.65rem;
			padding: 1px 6px;
			font-weight: 700;
		}

		.mobile-tab-btn.active .mobile-tab-badge {
			background: var(--color-primary);
			color: white;
		}

		/* On mobile: hide all columns, show active one */
		.col-left,
		.col-mid,
		.col-right {
			display: none;
			height: auto;
			min-height: 0;
		}

		.col-left.mobile-active,
		.col-mid.mobile-active,
		.col-right.mobile-active {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 12px;
		}

		.section {
			border-radius: 16px;
		}

		.scroll-area {
			/* On mobile, don't restrict height — let the page scroll */
			max-height: none;
			overflow-y: visible;
			-webkit-mask-image: none;
			mask-image: none;
			padding: 12px;
			padding-bottom: 20px;
			gap: 10px;
		}

		.big-create-btn {
			height: 70px;
			font-size: 1rem;
			padding: 0 20px;
			gap: 14px;
			border-radius: 16px;
		}

		.icon-circle {
			padding: 8px;
		}

		.history-link-section {
			flex: 0 0 70px;
		}

		.history-card {
			padding: 0 20px;
		}

		/* On mobile swipe rows need clean overflow for the slide to look right */
		.swipe-row {
			border-radius: 14px;
		}

		/* Hint text for swipe affordance in the empty state */
		.empty-placeholder small {
			opacity: 0.7;
			font-size: 0.78rem;
		}

		/* Disable grab cursor on mobile */
		[draggable='true'] {
			cursor: default;
		}
	}

	/* ── MOBILE FLOATING DROP ZONES ── */
	.touch-drop-overlay {
		position: fixed;
		bottom: 75px; /* sit just above the bottom nav */
		left: 12px;
		right: 12px;
		z-index: 10000;
		display: flex;
		gap: 10px;
		pointer-events: none; /* let touch events pass through to elementFromPoint */
	}

	.touch-drop-zone {
		flex: 1;
		min-height: 80px;
		border-radius: 18px;
		border: 2px dashed rgba(255, 255, 255, 0.35);
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		transition:
			background 0.18s ease,
			border-color 0.18s ease,
			transform 0.18s ease;
		pointer-events: none;
	}

	.touch-drop-zone.hovered {
		background: rgba(255, 255, 255, 0.22);
		border-color: white;
		border-style: solid;
		transform: scale(1.04);
	}

	.tdz-icon {
		font-size: 1.6rem;
		line-height: 1;
	}

	.tdz-label {
		font-size: 0.78rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.9);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.tdz-release {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 600;
		margin-top: 2px;
	}
</style>
