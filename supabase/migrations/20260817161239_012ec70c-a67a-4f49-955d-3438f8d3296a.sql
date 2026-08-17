
-- 1. Create Webhook Events table
CREATE TABLE IF NOT EXISTS public.provider_webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    external_event_id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    processed_at timestamp with time zone,
    status text DEFAULT 'PENDING',
    error text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(provider, external_event_id)
);

GRANT ALL ON public.provider_webhook_events TO authenticated, service_role;
ALTER TABLE public.provider_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can see all webhooks') THEN
        CREATE POLICY "Admins can see all webhooks" ON public.provider_webhook_events 
        FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- 2. Update deposits table
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS provider text DEFAULT 'simulation';
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS provider_payment_id text;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS provider_status text;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS external_reference text UNIQUE;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS is_simulated boolean DEFAULT true;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS pix_qr_code text;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS pix_copy_paste text;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS error_log text;

-- 3. Update withdrawals table
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS provider text DEFAULT 'simulation';
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS provider_withdrawal_id text;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS provider_status text;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS is_simulated boolean DEFAULT true;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS pix_key text;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS pix_key_type text;

-- 4. Update app_settings
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'SIMULATION';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS min_deposit numeric DEFAULT 10;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS max_deposit numeric DEFAULT 10000;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS deposits_enabled boolean DEFAULT true;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS withdrawals_enabled boolean DEFAULT true;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS asaas_webhook_secret text;

-- 5. Atomic Deposit Confirmation Function
CREATE OR REPLACE FUNCTION public.process_confirmed_deposit(
    p_external_reference text,
    p_provider_payment_id text,
    p_amount numeric,
    p_paid_at timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deposit_id uuid;
    v_user_id uuid;
    v_current_status text;
    v_internal_amount numeric;
BEGIN
    -- 1. Lock and get deposit info
    SELECT id, user_id, status, amount INTO v_deposit_id, v_user_id, v_current_status, v_internal_amount
    FROM public.deposits
    WHERE external_reference = p_external_reference
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'DEPOSIT_NOT_FOUND';
    END IF;

    -- 2. Idempotency check
    IF v_current_status = 'PAID' THEN
        RETURN;
    END IF;

    -- 3. Amount validation (strict)
    IF v_internal_amount != p_amount THEN
        UPDATE public.deposits 
        SET status = 'ERROR', error_log = 'AMOUNT_MISMATCH: expected ' || v_internal_amount || ' got ' || p_amount
        WHERE id = v_deposit_id;
        RAISE EXCEPTION 'AMOUNT_MISMATCH';
    END IF;

    -- 4. Update deposit status
    UPDATE public.deposits
    SET status = 'PAID',
        paid_at = p_paid_at,
        provider_payment_id = p_provider_payment_id,
        updated_at = now()
    WHERE id = v_deposit_id;

    -- 5. Credit Wallet
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE user_id = v_user_id;

    -- 6. Create Ledger Entry
    INSERT INTO public.ledger (user_id, amount, type, reference_id, description)
    VALUES (v_user_id, p_amount, 'DEPOSIT', v_deposit_id, 'Depósito via Pix (Asaas) confirmado');

END;
$$;
