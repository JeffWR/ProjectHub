-- Add position column for custom task ordering
-- Run this in Supabase SQL Editor

-- 1. Add position column (defaults to 0)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- 2. Initialize positions for existing tasks (by creation date, oldest = 0)
WITH ranked_tasks AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1 AS new_position
    FROM public.tasks
)
UPDATE public.tasks t
SET position = rt.new_position
FROM ranked_tasks rt
WHERE t.id = rt.id;

-- 3. Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(user_id, position);

-- 4. Verify positions were set
-- SELECT id, title, position, created_at FROM public.tasks ORDER BY user_id, position;
