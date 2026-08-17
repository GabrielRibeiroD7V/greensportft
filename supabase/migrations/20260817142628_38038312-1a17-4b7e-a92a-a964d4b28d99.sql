-- 1. Enums and Types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.ticket_status AS ENUM ('PENDING', 'WON', 'LOST', 'VOID', 'CANCELLED');
CREATE TYPE public.selection_status AS ENUM ('pending', 'won', 'lost', 'void');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'bet', 'win', 'withdrawal', 'refund', 'adjustment', 'chargeback');

-- 2. User Roles & Profiles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. Sports Data
CREATE TABLE public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) NOT NULL,
    home_team_id UUID REFERENCES public.teams(id) NOT NULL,
    away_team_id UUID REFERENCES public.teams(id) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'NS', -- NS: Not Started, LIVE, FT: Finished, etc.
    home_score INTEGER,
    away_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Markets and Odds
CREATE TABLE public.markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID REFERENCES public.fixtures(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., "Match Winner", "Total Goals"
    category TEXT, -- e.g., "Result", "Gols", "Escanteios"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.market_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., "Home", "Draw", "Over 2.5"
    odd DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Betting Tickets
CREATE TABLE public.betting_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    ticket_code TEXT UNIQUE NOT NULL, -- e.g., GF-000001
    total_odd DECIMAL(10, 2) NOT NULL,
    stake DECIMAL(10, 2) NOT NULL,
    potential_return DECIMAL(10, 2) NOT NULL,
    status ticket_status DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.betting_ticket_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.betting_tickets(id) ON DELETE CASCADE NOT NULL,
    fixture_id UUID REFERENCES public.fixtures(id) NOT NULL,
    market_name TEXT NOT NULL,
    selection_name TEXT NOT NULL,
    odd DECIMAL(10, 2) NOT NULL,
    status selection_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Wallets & Transactions
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'BRL',
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    reference_id UUID, -- Reference to ticket_id or deposit_id
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Grants & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixtures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.markets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.betting_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.betting_ticket_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO authenticated;

GRANT ALL ON public.competitions TO service_role;
GRANT ALL ON public.teams TO service_role;
GRANT ALL ON public.fixtures TO service_role;
GRANT ALL ON public.markets TO service_role;
GRANT ALL ON public.market_options TO service_role;
GRANT ALL ON public.betting_tickets TO service_role;
GRANT ALL ON public.betting_ticket_items TO service_role;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.wallet_transactions TO service_role;

GRANT SELECT ON public.competitions TO anon;
GRANT SELECT ON public.teams TO anon;
GRANT SELECT ON public.fixtures TO anon;
GRANT SELECT ON public.markets TO anon;
GRANT SELECT ON public.market_options TO anon;

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_ticket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read competitions" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read fixtures" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "Public read markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Public read market_options" ON public.market_options FOR SELECT USING (true);

CREATE POLICY "Users can see their own tickets" ON public.betting_tickets
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can see their own ticket items" ON public.betting_ticket_items
FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.betting_tickets 
        WHERE id = public.betting_ticket_items.ticket_id 
        AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Users can see their own wallet" ON public.wallets
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can see their own transactions" ON public.wallet_transactions
FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.wallets 
        WHERE id = public.wallet_transactions.wallet_id 
        AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
);

-- 8. Initial Mock Data Seed
DO $$ 
DECLARE
    comp_id UUID;
    team_a UUID;
    team_b UUID;
    fixture_id UUID;
    market_id UUID;
BEGIN
    INSERT INTO public.competitions (name, country) VALUES ('Premier League', 'England') RETURNING id INTO comp_id;
    INSERT INTO public.teams (name) VALUES ('Arsenal') RETURNING id INTO team_a;
    INSERT INTO public.teams (name) VALUES ('Manchester City') RETURNING id INTO team_b;
    
    INSERT INTO public.fixtures (competition_id, home_team_id, away_team_id, start_time, status)
    VALUES (comp_id, team_a, team_b, now() + interval '2 hours', 'NS') RETURNING id INTO fixture_id;
    
    INSERT INTO public.markets (fixture_id, name, category)
    VALUES (fixture_id, 'Resultado Final', 'Result') RETURNING id INTO market_id;
    
    INSERT INTO public.market_options (market_id, name, odd) VALUES (market_id, 'Arsenal', 2.50);
    INSERT INTO public.market_options (market_id, name, odd) VALUES (market_id, 'Empate', 3.40);
    INSERT INTO public.market_options (market_id, name, odd) VALUES (market_id, 'Man City', 2.80);
END $$;
