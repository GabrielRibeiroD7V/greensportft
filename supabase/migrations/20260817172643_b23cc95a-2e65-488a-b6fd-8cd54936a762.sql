CREATE OR REPLACE FUNCTION public.place_bet(p_user_id uuid, p_stake numeric, p_selections jsonb, p_idempotency_key uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_wallet_id UUID;
    v_wallet_balance DECIMAL;
    v_ticket_id UUID;
    v_ticket_code TEXT;
    v_total_odd DECIMAL := 1.0;
    v_selection RECORD;
    v_potential_return DECIMAL;
BEGIN
    -- 0. Callers acting as an end user may only bet for themselves
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    IF auth.uid() IS NULL AND current_setting('role', true) <> 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    SELECT id INTO v_ticket_id FROM public.betting_tickets WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
        RETURN v_ticket_id;
    END IF;

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

    FOR v_selection IN SELECT * FROM jsonb_to_recordset(p_selections) AS x(fixture_id UUID, market_name TEXT, selection_name TEXT, odd DECIMAL)
    LOOP
        v_total_odd := v_total_odd * v_selection.odd;
    END LOOP;

    v_potential_return := v_total_odd * p_stake;
    v_ticket_code := 'GS-' || upper(substring(md5(random()::text), 1, 6));

    INSERT INTO public.betting_tickets (
        user_id, ticket_code, total_odd, stake, potential_return, status, idempotency_key
    ) VALUES (
        p_user_id, v_ticket_code, v_total_odd, p_stake, v_potential_return, 'PENDING', p_idempotency_key
    ) RETURNING id INTO v_ticket_id;

    INSERT INTO public.betting_ticket_items (
        ticket_id, fixture_id, market_name, selection_name, odd, status
    )
    SELECT
        v_ticket_id,
        (sel->>'fixture_id')::UUID,
        sel->>'market_name',
        sel->>'selection_name',
        (sel->>'odd')::DECIMAL,
        'pending'
    FROM jsonb_array_elements(p_selections) AS sel;

    UPDATE public.wallets
    SET balance = balance - p_stake, updated_at = now()
    WHERE id = v_wallet_id;

    INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, balance_before, balance_after, reference_id, description
    ) VALUES (
        v_wallet_id, 'bet', -p_stake, v_wallet_balance, v_wallet_balance - p_stake, v_ticket_id, 'Bet placed: ' || v_ticket_code
    );

    RETURN v_ticket_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_wallet_id UUID;
    v_balance DECIMAL;
    v_withdrawal_id UUID;
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    IF auth.uid() IS NULL AND current_setting('role', true) <> 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Valor de saque deve ser positivo';
    END IF;

    SELECT id, balance INTO v_wallet_id, v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente para saque';
    END IF;

    INSERT INTO public.withdrawals (user_id, amount, status)
    VALUES (p_user_id, p_amount, 'PENDING')
    RETURNING id INTO v_withdrawal_id;

    UPDATE public.wallets SET balance = balance - p_amount, updated_at = now() WHERE id = v_wallet_id;

    INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, balance_before, balance_after, reference_id, description
    ) VALUES (
        v_wallet_id, 'withdrawal', -p_amount, v_balance, v_balance - p_amount, v_withdrawal_id, 'Saque solicitado (pendente)'
    );

    RETURN v_withdrawal_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.place_bet(uuid, numeric, jsonb, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_bet(uuid, numeric, jsonb, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(uuid, numeric) TO authenticated, service_role;