
-- 1. Alter app_settings to include odds_data_mode and odds_stale_after_seconds
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS odds_data_mode TEXT CHECK (odds_data_mode IN ('SIMULATION', 'REAL')) DEFAULT 'SIMULATION',
ADD COLUMN IF NOT EXISTS odds_stale_after_seconds INTEGER DEFAULT 60;

-- 2. Create Market Mappings and Selection Mappings
CREATE TABLE IF NOT EXISTS public.market_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_market_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_market_id TEXT NOT NULL,
    provider_market_name TEXT,
    UNIQUE(provider, provider_market_id),
    UNIQUE(provider, internal_market_name)
);

CREATE TABLE IF NOT EXISTS public.selection_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_selection_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_selection_id TEXT NOT NULL,
    provider_selection_name TEXT,
    UNIQUE(provider, provider_selection_id),
    UNIQUE(provider, internal_selection_name)
);

-- 3. Enhance Odds Table (market_options)
ALTER TABLE public.market_options
ADD COLUMN IF NOT EXISTS provider_odd DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('OPEN', 'SUSPENDED', 'CLOSED', 'STALE', 'SETTLED')) DEFAULT 'OPEN',
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS line TEXT,
ADD COLUMN IF NOT EXISTS source_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_provider_update TIMESTAMPTZ;

-- 4. Betting Ticket Items - Add Snapshot columns
ALTER TABLE public.betting_ticket_items
ADD COLUMN IF NOT EXISTS odd_snapshot JSONB,
ADD COLUMN IF NOT EXISTS odd_status_at_bet TEXT;

-- 5. RBAC & Security (Avoiding parameter rename issue)
GRANT SELECT ON public.market_mappings TO authenticated;
GRANT ALL ON public.market_mappings TO service_role;

GRANT SELECT ON public.selection_mappings TO authenticated;
GRANT ALL ON public.selection_mappings TO service_role;

ALTER TABLE public.market_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_mappings ENABLE ROW LEVEL SECURITY;

-- Note: We assume has_role exists and works as intended from previous phases.
-- If we really needed to replace it, we'd drop it first, but it's risky if policies depend on it.
-- Let's just create the policies using the existing function signature.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'market_mappings' AND policyname = 'Admins can manage market_mappings'
    ) THEN
        CREATE POLICY "Admins can manage market_mappings" ON public.market_mappings
            FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'selection_mappings' AND policyname = 'Admins can manage selection_mappings'
    ) THEN
        CREATE POLICY "Admins can manage selection_mappings" ON public.selection_mappings
            FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_market_options_status ON public.market_options(status);
CREATE INDEX IF NOT EXISTS idx_market_options_is_simulated ON public.market_options(is_simulated);
