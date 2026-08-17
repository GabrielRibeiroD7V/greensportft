
-- Revoke public access to sensitive security definer functions with correct types
REVOKE EXECUTE ON FUNCTION public.process_confirmed_deposit(text, text, numeric, timestamp with time zone) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_fixture(uuid, integer, integer, integer, integer) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.place_bet(uuid, numeric, jsonb, uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(uuid) FROM public, anon;

-- Grant access only to service_role for process_confirmed_deposit (called by webhook)
GRANT EXECUTE ON FUNCTION public.process_confirmed_deposit(text, text, numeric, timestamp with time zone) TO service_role;

-- Grant access to authenticated for place_bet
GRANT EXECUTE ON FUNCTION public.place_bet(uuid, numeric, jsonb, uuid) TO authenticated;

-- Admin-only functions (checked via RBAC inside or by being admin)
GRANT EXECUTE ON FUNCTION public.settle_fixture(uuid, integer, integer, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid) TO authenticated, service_role;
