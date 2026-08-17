# GreenSport Phase 2: Internal Simulation & Data Infrastructure

We are transitioning the project to a high-fidelity simulation environment. This phase focuses on building a complete end-to-end operational flow using persistent database records, advanced betting logic, and comprehensive admin controls, without external API dependencies.

## 1. Database & Simulation Seeds
*   **Seed Strategy**: Create a robust set of persistent data in Supabase for:
    *   **Competitions**: Major leagues (Brasileirão, Premier League, etc.).
    *   **Fixtures**: Distributed across different timelines (Live, Today, Tomorrow, Future, Finished).
    *   **Markets & Odds**: Comprehensive markets (Winner, BTTS, Over/Under, Corners, Cards) for each fixture.
*   **Persistent Statuses**: Implement consistent internal states for fixtures (SCHEDULED, LIVE, FINISHED, etc.) and markets (OPEN, SUSPENDED, SETTLED).

## 2. Public Simulation Experience (`/football`)
*   **Enhanced Layout**:
    *   **Sidebar**: Functional competition filter.
    *   **Central Area**: Organized fixture list by time (Live, Today, Upcoming).
    *   **Fixture Details**: Tabbed view for various market categories (Main, Goals, Corners, etc.).
*   **Advanced Bet Slip**:
    *   Support for multiple selections and accumulator calculation.
    *   Real-time potential return calculation.
    *   Conflict detection: Prevent multiple incompatible selections from the same match.

## 3. Financial & User Infrastructure
*   **Wallet & Ledger**:
    *   Functional `/account` area showing balance and bet history.
    *   Simulated deposit and withdrawal flow in the admin panel.
    *   Immutable ledger (`wallet_transactions`) for every movement.
*   **Authentication**:
    *   Enable anonymous slip building.
    *   Require login only at the point of placing the bet.

## 4. Admin Operation & Settlement Engine
*   **Match Simulation**:
    *   Admin tool to set match scores, corners, and cards.
    *   Status transition controls (e.g., LIVE -> FINISHED).
*   **Settlement Motor**:
    *   Implement `settleFixture` RPC/function.
    *   Logic for Match Winner, Double Chance, Total Goals, BTTS, Corners, and Cards.
    *   **VOID Handling**: Recalculate accumulator odds if a selection is voided.
    *   **Atomic Payouts**: Prevent double-crediting of wins.

## 5. Security & Technical Stabilization
*   **RLS Verification**: Ensure users can only access their own financial data.
*   **Transactional Integrity**: Use PostgreSQL RPCs for critical actions (bet placement, settlement).

## Technical Details
*   **Backend**: TanStack Start server functions calling Supabase RPCs.
*   **Frontend**: React 19, Tailwind v4, Lucide icons, Sonner toasts.
*   **Database**: PostgreSQL with RLS and specific constraints for financial precision.
