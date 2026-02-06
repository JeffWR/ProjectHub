-- Add completed_at column if it doesn't exist
-- This column tracks when a task was marked as archived

-- Check if column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tasks'
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.tasks
        ADD COLUMN completed_at TIMESTAMPTZ;

        RAISE NOTICE 'Column completed_at added successfully';
    ELSE
        RAISE NOTICE 'Column completed_at already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name = 'completed_at';
