---
title: GreenSport Phase 3 Completion Plan
path: .lovable/plan.md
---

# Plan: GreenSport Phase 3 - Completion & Operational Stabilization

Finalize the operational infrastructure, security model, and user area for the GreenSport football betting platform.

## 1. Database & Security Infrastructure
- Create a new migration for `app_settings` table and functional financial management.
- Implement `request_withdrawal` and `approve_withdrawal` RPCs with atomic balance checks.
- Audit `SECURITY DEFINER` functions to ensure only `service_role` can execute sensitive administrative tasks.

## 2. Server-Side Logic (Phase 3 Core)
- Update `src/lib/pricing.server.ts` to fetch real config from `app_settings`.
- Refactor `src/lib/betting.functions.ts` to enforce server-side margins and dynamic limits fetched from the DB.
- Implement withdrawal server functions in `src/lib/admin.functions.ts`.

## 3. User Area Enhancement
- **Dashboard (/account):** Replace mocks with real aggregates (Total Apostado, Bilhetes, Saldo).
- **History (/my-bets):** Add detailed ticket view and status badges.
- **Wallet (/wallet):** Ensure transaction history reflects both manual deposits/withdrawals and automated bet settlements (win/loss).

## 4. Admin Panel Polish
- **Financials (/admin/finance):** Implement the withdrawal management tab (Approve/Reject).
- **Settings (/admin/settings):** Ensure full synchronization with the `app_settings` table.
- **Logs (/admin/logs):** Implement a simple audit log view for financial and settlement actions.

## 5. Final Audit & Stabilization
- End-to-end verification of the betting lifecycle: Placement -> Sync -> Settlement -> Payout.
- Verification of RLS policies for global data privacy.
