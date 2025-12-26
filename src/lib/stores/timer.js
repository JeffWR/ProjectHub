// Add these imports at the top
import { logSession } from './history'; 
import { get } from 'svelte/store'; // To read values from other stores
import { activeTaskId, tasks } from './tasks'; 

// ... inside your setInterval ...
if (state.timeLeft > 0) return { ...state, timeLeft: state.timeLeft - 1 };

// TIME IS UP LOGIC:
clearInterval(interval);

// 1. Get current task info
const currentTaskId = get(activeTaskId);
const allTasks = get(tasks);
const taskTitle = allTasks.find(t => t.id === currentTaskId)?.title || 'Unspecified Task';

// 2. Save to History Store
logSession(state.settings[state.mode], currentTaskId, taskTitle);

return { ...state, isRunning: false, timeLeft: 0 };