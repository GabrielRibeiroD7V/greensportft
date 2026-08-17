-- Final operational infrastructure for GreenSport Phase 3

-- 1. Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    global_margin_percentage DECIMAL(5, 2) DEFAULT 0,
    min_stake DECIMAL(15, 2) DEFAULT 10,
    max_stake DECIMAL(15, 2) DEFAULT 5000,
    max_payout DECIMAL(15, 2) DEFAULT 50000,
    max_ticket_selections INTEGER DEFAULT 15,
    betting_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial settings if empty
INSERT INTO public.app_settings (global_margin_percentage, min_stake, max_stake, max_payout, max_ticket_selections, betting_enabled)
SELECT 0, 10, 5000, 50000, 15, true
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public settings are readable by everyone" ON public.app_settings FOR SELECT TO authenticated USING (true);

-- 2. Enhanced Financial Functions (Withdrawals)
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id UUID, p_amount DECIMAL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet_id UUID;
    v_balance DECIMAL;
    v_withdrawal_id UUID;
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Valor de saque deve ser positivo';
    END IF;

    -- Lock wallet and check balance
    SELECT id, balance INTO v_wallet_id, v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente para saque';
    END IF;

    -- Create withdrawal record
    INSERT INTO public.withdrawals (user_id, amount, status)
    VALUES (p_user_id, p_amount, 'PENDING')
    RETURNING id INTO v_withdrawal_id;

    -- Debit wallet immediately (escrow)
    UPDATE public.wallets SET balance = balance - p_amount, updated_at = now() WHERE id = v_wallet_id;

    -- Record transaction
    INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, balance_before, balance_after, reference_id, description
    ) VALUES (
        v_wallet_id, 'withdrawal', -p_amount, v_balance, v_balance - p_amount, v_withdrawal_id, 'Saque solicitado (pendente)'
    );

    RETURN v_withdrawal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_withdrawal_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.withdrawals SET status = 'APPROVED', updated_at = now() WHERE id = p_withdrawal_id AND status = 'PENDING';
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(p_withdrawal_id UUID)
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
    -- Get withdrawal info
    SELECT user_id, amount INTO v_user_id, v_amount FROM public.withdrawals WHERE id = p_withdrawal_id AND status = 'PENDING' FOR UPDATE;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Update status
    UPDATE public.withdrawals SET status = 'REJECTED', updated_at = now() WHERE id = p_withdrawal_id;

    -- Refund wallet
    SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
    UPDATE public.wallets SET balance = balance + v_amount, updated_at = now() WHERE id = v_wallet_id;

    -- Record refund transaction
    INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, balance_before, balance_after, reference_id, description
    ) VALUES (
        v_wallet_id, 'deposit', v_amount, v_balance_before, v_balance_before + v_amount, p_withdrawal_id, 'Saque rejeitado - Estorno de saldo'
    );

    RETURN TRUE;
END;
$$;

-- 3. Security Auditing (Internal only)
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(UUID, DECIMAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(UUID, DECIMAL) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(UUID) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(UUID) FROM authenticated;
