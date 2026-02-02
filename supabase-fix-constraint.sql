-- Fix for status constraint mismatch
-- Run this in Supabase SQL Editor if you already created the tasks table

-- Drop the old constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Add the updated constraint that includes 'review'
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check
CHECK (status IN ('todo', 'inprogress', 'review', 'archived'));

-- Verify the constraint
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.tasks'::regclass AND contype = 'c';
