-- Revoke public and authenticated execution of the internal functions
REVOKE EXECUTE ON FUNCTION public.approve_deposit(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_deposit(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_deposit(UUID) FROM anon;

REVOKE EXECUTE ON FUNCTION public.settle_fixture(UUID, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.settle_fixture(UUID, INTEGER, INTEGER, INTEGER, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_fixture(UUID, INTEGER, INTEGER, INTEGER, INTEGER) FROM anon;

REVOKE EXECUTE ON FUNCTION public.place_bet(UUID, DECIMAL, JSONB, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.place_bet(UUID, DECIMAL, JSONB, UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.place_bet(UUID, DECIMAL, JSONB, UUID) FROM anon;
