---
title: GreenSport Phase 4 - Operational Completeness & Stabilization
path: .lovable/plan.md
---

# Plan: GreenSport Phase 4 - Final Operational Infrastructure

Audit, refine, and stabilize the football betting platform for operational completeness in a simulated environment.

## 1. Core Betting & UX Audit
- **Header:** Create a unified `src/components/layout/main-header.tsx` for public and authenticated states (Logo, Football, My Bets, Wallet, Account, Balance/Login).
- **Bet Slip:** Refine `src/components/bet-slip/bet-slip-content.tsx` to handle odd changes and suspended markets.
- **Validation:** Enhance `placeBet` in `src/lib/betting.functions.ts` to include strict checks for fixture availability, market status, and payout limits.

## 2. Dynamic Odds & Markets
- **Pricing:** Centralize display odd calculations to handle overrides (Global/Competition/Market) in `src/lib/pricing.server.ts`.
- **States:** Implement `ODDS_CHANGED` and `SUSPENDED` feedback loops between backend and frontend.
- **Snapshots:** Ensure `place_bet` RPC stores the exact odd and margin used at the moment of placement.

## 3. Financial & Admin Stabilization
- **Withdrawals:** Fully implement the PENDING -> APPROVED/REJECTED -> PAID lifecycle with ledger entries.
- **Admin Dashboard:** Replace remaining static placeholders with live aggregates from `betting_tickets` and `wallets`.
- **Risk Analysis:** Transition Risk Dashboard to fixture-level exposure tracking (Total liability per match outcome).
- **Audit Logs:** Implement a dedicated `audit_logs` table (migration) to track administrative actions (settings changes, manual settlements, finance approvals).

## 4. Operational Readiness (Simulated)
- **Providers:** Define `src/lib/football/provider.interface.ts` as a robust abstraction layer for future real-world integrations.
- **Webhooks:** Scaffold `src/routes/api/public/webhooks.ts` with signature verification logic (prepared for Asaas/Pix).
- **Testing:** Execute E2E scenarios A-O to verify idempotency, settlement precision, and role-based security.

## 5. Security & Build
- **RLS/RBAC:** Final audit of `SECURITY DEFINER` functions and table permissions.
- **Performance:** Add missing indices on `betting_tickets(created_at)`, `wallet_transactions(wallet_id)`, and `fixtures(start_time)`.
- **Build:** Verify TypeScript compliance and SSR stability.
