-- Verify the position column exists and has data
-- Run this in Supabase SQL Editor to check if migration worked

-- 1. Check if position column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'position';

-- 2. Check current position values for your tasks
SELECT id, title, position, status, created_at
FROM public.tasks
ORDER BY position;

-- 3. Count how many tasks have position set
SELECT
    COUNT(*) as total_tasks,
    COUNT(position) as tasks_with_position,
    COUNT(*) - COUNT(position) as tasks_without_position
FROM public.tasks;
