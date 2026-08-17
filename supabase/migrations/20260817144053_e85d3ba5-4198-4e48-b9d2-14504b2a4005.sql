-- 1. Add Idempotency key to betting_tickets
ALTER TABLE public.betting_tickets ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;

-- 2. Add non-negative constraint to wallets
ALTER TABLE public.wallets ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);

-- 3. The place_bet RPC for atomic and concurrent-safe betting
CREATE OR REPLACE FUNCTION public.place_bet(
    p_user_id UUID,
    p_stake DECIMAL,
    p_selections JSONB, -- Array of {fixture_id, market_name, selection_name, odd}
    p_idempotency_key UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet_id UUID;
    v_wallet_balance DECIMAL;
    v_ticket_id UUID;
    v_ticket_code TEXT;
    v_total_odd DECIMAL := 1.0;
    v_selection RECORD;
    v_potential_return DECIMAL;
BEGIN
    -- 1. Check idempotency
    SELECT id INTO v_ticket_id FROM public.betting_tickets WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
        RETURN v_ticket_id;
    END IF;

    -- 2. Lock wallet row and check balance (Concurrency protection)
    SELECT id, balance INTO v_wallet_id, v_wallet_balance 
    FROM public.wallets 
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_wallet_balance < p_stake THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- 3. Calculate total odd and validate selections (Backend re-calculation)
    FOR v_selection IN SELECT * FROM jsonb_to_recordset(p_selections) AS x(fixture_id UUID, market_name TEXT, selection_name TEXT, odd DECIMAL)
    LOOP
        -- In a real scenario, we would also verify if the odd matches the database's current odd
        -- For Fase 1, we trust the input but enforce the math here
        v_total_odd := v_total_odd * v_selection.odd;
    END LOOP;

    v_potential_return := v_total_odd * p_stake;
    v_ticket_code := 'GS-' || upper(substring(md5(random()::text), 1, 6));

    -- 4. Create Ticket
    INSERT INTO public.betting_tickets (
        user_id, 
        ticket_code, 
        total_odd, 
        stake, 
        potential_return, 
        status, 
        idempotency_key
    ) VALUES (
        p_user_id, 
        v_ticket_code, 
        v_total_odd, 
        p_stake, 
        v_potential_return, 
        'PENDING', 
        p_idempotency_key
    ) RETURNING id INTO v_ticket_id;

    -- 5. Create Items (Odd Snapshot)
    INSERT INTO public.betting_ticket_items (
        ticket_id, 
        fixture_id, 
        market_name, 
        selection_name, 
        odd, 
        status
    )
    SELECT 
        v_ticket_id, 
        (sel->>'fixture_id')::UUID, 
        sel->>'market_name', 
        sel->>'selection_name', 
        (sel->>'odd')::DECIMAL, 
        'pending'
    FROM jsonb_array_elements(p_selections) AS sel;

    -- 6. Update Wallet Balance (Ledger integration)
    UPDATE public.wallets 
    SET balance = balance - p_stake, 
        updated_at = now() 
    WHERE id = v_wallet_id;

    -- 7. Record Transaction (Ledger)
    INSERT INTO public.wallet_transactions (
        wallet_id, 
        type, 
        amount, 
        balance_before, 
        balance_after, 
        reference_id, 
        description
    ) VALUES (
        v_wallet_id, 
        'bet', 
        -p_stake, 
        v_wallet_balance, 
        v_wallet_balance - p_stake, 
        v_ticket_id, 
        'Bet placed: ' || v_ticket_code
    );

    RETURN v_ticket_id;
END;
$$;
