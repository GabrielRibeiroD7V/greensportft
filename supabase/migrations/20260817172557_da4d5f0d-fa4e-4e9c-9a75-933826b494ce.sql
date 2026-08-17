-- 1. Remove the payment webhook secret from the settings table (it lives in env secrets)
ALTER TABLE public.app_settings DROP COLUMN IF EXISTS asaas_webhook_secret;

-- 2. provider_mappings: explicit admin-only write policy
DROP POLICY IF EXISTS "Admins can manage provider_mappings" ON public.provider_mappings;
CREATE POLICY "Admins can manage provider_mappings"
ON public.provider_mappings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE INSERT, UPDATE, DELETE ON public.provider_mappings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_mappings TO authenticated;

-- 3. Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.approve_deposit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_fixture(uuid, integer, integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_confirmed_deposit(text, text, numeric, timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.place_bet(uuid, numeric, jsonb, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.approve_deposit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_fixture(uuid, integer, integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_confirmed_deposit(text, text, numeric, timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.place_bet(uuid, numeric, jsonb, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 4. Defense in depth: bets can only be created through place_bet (no direct table writes)
REVOKE INSERT, UPDATE, DELETE ON public.betting_tickets FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.betting_ticket_items FROM anon, authenticated;