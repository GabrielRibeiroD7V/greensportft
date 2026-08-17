-- Migration to add financial operations and simulation support

-- 1. Create Deposits table for simulation
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, FAILED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own deposits" ON public.deposits FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2. Create Withdrawals table for simulation
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PAID, REJECTED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. RPC for simulating deposit approval
CREATE OR REPLACE FUNCTION public.approve_deposit(p_deposit_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_amount DECIMAL;
    v_wallet_id UUID;
    v_balance_before DECIMAL;
BEGIN
    -- Check if deposit is pending
    SELECT user_id, amount INTO v_user_id, v_amount FROM public.deposits WHERE id = p_deposit_id AND status = 'PENDING' FOR UPDATE;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get wallet
    SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    -- Update deposit status
    UPDATE public.deposits SET status = 'PAID', updated_at = now() WHERE id = p_deposit_id;

    -- Update wallet balance
    UPDATE public.wallets SET balance = balance + v_amount, updated_at = now() WHERE id = v_wallet_id;

    -- Record transaction
    INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, balance_before, balance_after, reference_id, description
    ) VALUES (
        v_wallet_id, 'deposit', v_amount, v_balance_before, v_balance_before + v_amount, p_deposit_id, 'Deposit approved'
    );

    RETURN TRUE;
END;
$$;

-- 4. RPC for fixture settlement
CREATE OR REPLACE FUNCTION public.settle_fixture(
    p_fixture_id UUID,
    p_home_score INTEGER,
    p_away_score INTEGER,
    p_corners INTEGER DEFAULT NULL,
    p_cards INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item RECORD;
    v_ticket_id UUID;
    v_all_won BOOLEAN;
    v_any_lost BOOLEAN;
    v_potential_payout DECIMAL;
    v_user_id UUID;
    v_wallet_id UUID;
    v_balance_before DECIMAL;
    v_ticket_status ticket_status;
BEGIN
    -- 1. Update fixture status and scores
    UPDATE public.fixtures 
    SET home_score = p_home_score, 
        away_score = p_away_score, 
        status = 'FT', 
        updated_at = now() 
    WHERE id = p_fixture_id;

    -- 2. Liquidate items for this fixture
    FOR v_item IN SELECT * FROM public.betting_ticket_items WHERE fixture_id = p_fixture_id AND status = 'pending'
    LOOP
        -- MATCH_WINNER logic
        IF v_item.market_name = 'Resultado Final' OR v_item.market_name = 'MATCH_WINNER' THEN
            IF (v_item.selection_name = 'Home' OR v_item.selection_name = '1' OR v_item.selection_name = (SELECT name FROM teams WHERE id = (SELECT home_team_id FROM fixtures WHERE id = p_fixture_id))) AND p_home_score > p_away_score THEN
                UPDATE public.betting_ticket_items SET status = 'won' WHERE id = v_item.id;
            ELSIF (v_item.selection_name = 'Away' OR v_item.selection_name = '2' OR v_item.selection_name = (SELECT name FROM teams WHERE id = (SELECT away_team_id FROM fixtures WHERE id = p_fixture_id))) AND p_away_score > p_home_score THEN
                UPDATE public.betting_ticket_items SET status = 'won' WHERE id = v_item.id;
            ELSIF (v_item.selection_name = 'Draw' OR v_item.selection_name = 'Empate' OR v_item.selection_name = 'X') AND p_home_score = p_away_score THEN
                UPDATE public.betting_ticket_items SET status = 'won' WHERE id = v_item.id;
            ELSE
                UPDATE public.betting_ticket_items SET status = 'lost' WHERE id = v_item.id;
            END IF;
        END IF;
    END LOOP;

    -- 3. Update tickets affected by this fixture
    FOR v_ticket_id IN 
        SELECT DISTINCT ticket_id FROM public.betting_ticket_items WHERE fixture_id = p_fixture_id
    LOOP
        -- Check if ticket is still pending
        SELECT status, user_id INTO v_ticket_status, v_user_id FROM public.betting_tickets WHERE id = v_ticket_id;
        IF v_ticket_status != 'PENDING' THEN
            CONTINUE;
        END IF;

        -- Determine overall ticket status
        SELECT 
            EXISTS(SELECT 1 FROM public.betting_ticket_items WHERE ticket_id = v_ticket_id AND status = 'lost'),
            NOT EXISTS(SELECT 1 FROM public.betting_ticket_items WHERE ticket_id = v_ticket_id AND status = 'pending')
        INTO v_any_lost, v_all_won;

        IF v_any_lost THEN
            UPDATE public.betting_tickets SET status = 'LOST' WHERE id = v_ticket_id;
        ELSIF v_all_won THEN
            -- Ticket is WON
            SELECT potential_return INTO v_potential_payout FROM public.betting_tickets WHERE id = v_ticket_id;
            
            -- Lock wallet
            SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;

            -- Update ticket
            UPDATE public.betting_tickets SET status = 'WON' WHERE id = v_ticket_id;

            -- Credit wallet
            UPDATE public.wallets SET balance = balance + v_potential_payout, updated_at = now() WHERE id = v_wallet_id;

            -- Record transaction
            INSERT INTO public.wallet_transactions (
                wallet_id, type, amount, balance_before, balance_after, reference_id, description
            ) VALUES (
                v_wallet_id, 'win', v_potential_payout, v_balance_before, v_balance_before + v_potential_payout, v_ticket_id, 'Bet won payout'
            );
        END IF;
    END LOOP;
END;
$$;
