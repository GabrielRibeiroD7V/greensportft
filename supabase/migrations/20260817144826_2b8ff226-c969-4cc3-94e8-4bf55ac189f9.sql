-- 1. Provider Mappings Table
CREATE TABLE public.provider_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_id UUID NOT NULL,
    provider TEXT NOT NULL, -- e.g., 'api-football'
    provider_entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'competition', 'season', 'team', 'fixture'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (provider, provider_entity_id, entity_type)
);

GRANT SELECT ON public.provider_mappings TO authenticated;
GRANT ALL ON public.provider_mappings TO service_role;
ALTER TABLE public.provider_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read mappings" ON public.provider_mappings FOR SELECT USING (true);

-- 2. Sync Logs Table
CREATE TABLE public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    sync_type TEXT NOT NULL,
    records_received INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_message TEXT,
    status TEXT NOT NULL, -- 'SUCCESS', 'PARTIAL', 'FAILED'
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ
);

GRANT SELECT ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can see sync logs" ON public.sync_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Update existing tables to support provider mapping and syncing
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS type TEXT; -- 'league', 'cup'
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS round TEXT;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Seasons Table
CREATE TABLE public.seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (competition_id, year)
);

GRANT SELECT ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;
GRANT SELECT ON public.seasons TO anon;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read seasons" ON public.seasons FOR SELECT USING (true);

-- 5. Add unique indexes for upsert logic
CREATE UNIQUE INDEX IF NOT EXISTS idx_fixtures_provider ON public.fixtures (provider_id) WHERE provider_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_competitions_provider ON public.competitions (provider_id) WHERE provider_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_provider ON public.teams (provider_id) WHERE provider_id IS NOT NULL;
