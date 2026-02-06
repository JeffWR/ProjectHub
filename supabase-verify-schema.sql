-- Comprehensive schema verification and fix
-- Run this in Supabase SQL Editor to ensure all columns exist

-- 1. Check current table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 2. Add missing columns if needed
DO $$
BEGIN
    -- Add completed_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added completed_at column';
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;

    -- Ensure time_spent is NUMERIC (not INTEGER)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'time_spent'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.tasks
        ALTER COLUMN time_spent TYPE NUMERIC USING time_spent::NUMERIC;
        RAISE NOTICE 'Changed time_spent from INTEGER to NUMERIC';
    END IF;

    RAISE NOTICE 'Schema verification complete';
END $$;

-- 3. Reload schema cache (forces Supabase to recognize changes)
NOTIFY pgrst, 'reload schema';

-- 4. Verify final structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tasks'
ORDER BY ordinal_position;
