-- Prepare GreenSport Phase 5A: Football Integration

-- 1. Add mode and status to app_settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='football_data_mode') THEN
        ALTER TABLE public.app_settings ADD COLUMN football_data_mode TEXT DEFAULT 'SIMULATION';
    END IF;
END $$;

-- 2. Ensure mapping and source columns
DO $$ 
BEGIN
    -- Competitions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competitions' AND column_name='provider_id') THEN
        ALTER TABLE public.competitions ADD COLUMN provider_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competitions' AND column_name='is_simulated') THEN
        ALTER TABLE public.competitions ADD COLUMN is_simulated BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competitions' AND column_name='last_provider_update') THEN
        ALTER TABLE public.competitions ADD COLUMN last_provider_update TIMESTAMPTZ;
    END IF;

    -- Teams
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='provider_id') THEN
        ALTER TABLE public.teams ADD COLUMN provider_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='is_simulated') THEN
        ALTER TABLE public.teams ADD COLUMN is_simulated BOOLEAN DEFAULT true;
    END IF;

    -- Fixtures
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fixtures' AND column_name='provider_id') THEN
        ALTER TABLE public.fixtures ADD COLUMN provider_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fixtures' AND column_name='is_simulated') THEN
        ALTER TABLE public.fixtures ADD COLUMN is_simulated BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fixtures' AND column_name='last_provider_update') THEN
        ALTER TABLE public.fixtures ADD COLUMN last_provider_update TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Sync logs for integration monitoring
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    details JSONB
);

GRANT SELECT, INSERT ON public.sync_logs TO service_role;
GRANT SELECT ON public.sync_logs TO authenticated;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all sync logs" ON public.sync_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add unique constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'competitions_provider_id_idx') THEN
        CREATE UNIQUE INDEX competitions_provider_id_idx ON public.competitions(provider_id) WHERE provider_id IS NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'teams_provider_id_idx') THEN
        CREATE UNIQUE INDEX teams_provider_id_idx ON public.teams(provider_id) WHERE provider_id IS NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fixtures_provider_id_idx') THEN
        CREATE UNIQUE INDEX fixtures_provider_id_idx ON public.fixtures(provider_id) WHERE provider_id IS NOT NULL;
    END IF;
END $$;