-- Fix time_spent column type from INTEGER to NUMERIC
-- This allows storing fractional minutes (e.g., 0.333 for 20 seconds)
-- Execute this in your Supabase SQL Editor

-- Change the column type from INTEGER to NUMERIC
ALTER TABLE public.tasks
ALTER COLUMN time_spent TYPE NUMERIC USING time_spent::NUMERIC;

-- Verify the change (optional - uncomment to test)
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'tasks' AND column_name = 'time_spent';
