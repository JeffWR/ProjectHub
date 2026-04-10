-- ProjectHub: Add pomodoro_sessions table
-- Run this in your Supabase Dashboard > SQL Editor > New Query

-- ========================================
-- 1. CREATE POMODORO_SESSIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    task_title TEXT DEFAULT 'Focus',
    duration INTEGER NOT NULL DEFAULT 25,         -- session length in minutes
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),      -- when the session ended
    started_at TIMESTAMPTZ,                       -- when the session started
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id
    ON public.pomodoro_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_date
    ON public.pomodoro_sessions(date DESC);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_date
    ON public.pomodoro_sessions(user_id, date DESC);

-- ========================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CREATE RLS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view own sessions"   ON public.pomodoro_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.pomodoro_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.pomodoro_sessions;

CREATE POLICY "Users can view own sessions"
    ON public.pomodoro_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON public.pomodoro_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON public.pomodoro_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- VERIFICATION (optional — uncomment to run)
-- ========================================

-- SELECT * FROM public.pomodoro_sessions LIMIT 5;
-- SELECT tablename, policyname FROM pg_policies WHERE tablename = 'pomodoro_sessions';
