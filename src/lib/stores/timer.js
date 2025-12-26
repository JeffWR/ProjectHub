// ... imports
import { updateTaskProgress } from './tasks'; // Import the new function

// ... inside start() -> setInterval ...
interval = setInterval(() => {
    update(state => {
        // 1. DECREASE TIMER
        if (state.timeLeft > 0) {
            // NEW: Update task progress in real-time (every second)
            if (state.mode === 'pomodoro') {
                const currentTaskId = get(activeTaskId);
                if (currentTaskId) {
                    updateTaskProgress(currentTaskId, 1); // Add 1 second of progress
                }
            }
            return { ...state, timeLeft: state.timeLeft - 1 };
        }
        
        // 2. TIME IS UP
        clearInterval(interval);
        
        // (Log session logic remains mostly the same, but progress is already updated!)
        const currentTaskId = get(activeTaskId);
        const allTasks = get(tasks);
        const taskTitle = allTasks.find(t => t.id === currentTaskId)?.title || 'Unspecified Task';

        if (state.mode === 'pomodoro') {
            logSession(state.settings.pomodoro, currentTaskId, taskTitle);
            addToast(`Session Complete!`, 'success');
        }

        return { ...state, isRunning: false, timeLeft: state.settings[state.mode] * 60 }; 
    });
}, 1000);