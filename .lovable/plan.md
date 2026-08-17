# GreenSport Development Plan - Phase 1

Establish a solid technical foundation for a football-only betting platform, prioritizing a functional Administrative Panel and a simulated public betting flow.

## 1. Database & Security Schema
- Create core tables (relational structure): `profiles`, `user_roles`, `competitions`, `teams`, `fixtures`, `markets`, `market_options`, `odds`, `betting_tickets`, `betting_ticket_items`, `wallets`, `wallet_transactions`.
- Implement `has_role` security-definer function.
- Configure RLS and GRANTS for all tables.
- Seed initial mock data for matches, markets, and teams to make the UI functional immediately.

## 2. Shared Services & Providers
- **FootballProvider:** Abstract interface for fixture/odd data (simulated for now).
- **PaymentProvider:** Abstract interface for transactions (simulated for now).
- **OddCalculator:** Service for margin application and accumulated odd calculation.
- **WalletService:** Transactional ledger for balance management.

## 3. Administrative Panel (/admin)
- **Layout:** Professional sidebar navigation.
- **Dashboard:** Operational metrics (Total bet, exposure, active tickets).
- **Ticket Management:** Detailed view of every selection status within a ticket.
- **User/Match Management:** Tables with filters and deep-dive views.

## 4. Public Simulation (/football)
- **Fixture List:** Grouped by "Live", "Today", "Upcoming".
- **Betting Slip (Right Sidebar):** Interactive selection adding, odd multiplication, and potential return calculation.
- **Checkout Flow:** Persist ticket to DB after (simulated) login.

## Technical Details
- Use TanStack Router for nested admin routes.
- Tailwind v4 for high-density, professional UI.
- All server-side logic in `createServerFn` (e.g., ticket submission, wallet adjustments).
- No external APIs or secret keys in this phase.
