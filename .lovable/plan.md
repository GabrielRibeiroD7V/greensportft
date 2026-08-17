---
title: GreenSport Phase 1 Stabilization Plan
description: Core transactional stabilization, administrative metrics, and security audit.
---

## Phase 1 Stabilization: Core Infrastructure

### 1. Database & Transactional Integrity
- **Transactional Bets**: Move `placeBet` logic to a PostgreSQL function (`place_bet`) to ensure atomicity across tickets, items, wallet debits, and ledger entries.
- **Concurrency Control**: Use `SELECT FOR UPDATE` on the user's wallet row to prevent double-spending in race conditions.
- **Financial Precision**: Audit schema to ensure `DECIMAL/NUMERIC` types are used (already present, will verify constraints). Add `CHECK (balance >= 0)` to `wallets` table.
- **Idempotency**: Add an `idempotency_key` (UUID) to `betting_tickets` with a `UNIQUE` constraint to prevent duplicate submissions.

### 2. Backend Business Logic
- **Full Validation**: Recalculate all odds and potential returns on the server based on current database state.
- **Odd Snapshots**: Ensure the `betting_ticket_items` table stores the exact odd at the time of placement, independent of future market shifts.
- **Authentication**: Use `requireSupabaseAuth` middleware for all betting and administrative server functions.

### 3. Administrative Dashboard
- **Real-time Metrics**: Replace all mock values in `src/lib/admin.functions.ts` with real Supabase aggregations.
  - `totalApostadoHoje`: SUM of stakes for today's tickets.
  - `bilhetes`: Counts per status (PENDING, WON, LOST, etc.).
  - `exposicaoBruta`: SUM of potential payouts for PENDING tickets.
  - `usuarios`: Total profile count.
- **Ticket Audit**: Verify `/admin/tickets` displays real-time data from the `betting_tickets` table.

### 4. Security & RLS
- **Revalidate RLS**: Ensure users can only read their own tickets/wallets and cannot perform manual inserts/updates to financial or outcome-related tables.
- **Server-Side Protection**: Ensure sensitive operations (like marking a bet as WON) are exclusively handled by server functions or database triggers.

## Technical Details

### Proposed SQL Changes
```sql
-- Idempotency and Financial Constraints
ALTER TABLE public.betting_tickets ADD COLUMN idempotency_key UUID UNIQUE;
ALTER TABLE public.wallets ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);

-- Transactional Function
CREATE OR REPLACE FUNCTION public.place_bet(
    p_user_id UUID,
    p_stake DECIMAL,
    p_selections JSONB, -- Array of {fixture_id, market_name, selection_name, odd}
    p_idempotency_key UUID
) RETURNS UUID AS $$ ... $$ LANGUAGE plpgsql;
```

### Server Function Updates
- Update `placeBet` in `src/lib/betting.functions.ts` to call the new RPC.
- Implement Zod validation for input data.

### Admin Logic Updates
- Refactor `getAdminStats` to use `.select('*', { count: 'exact' })` and `.sum()` aggregations.
