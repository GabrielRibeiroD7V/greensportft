# Plan: Hardening Authenticated Routes Visibility

The goal is to eliminate the "blank screen" issue on `/wallet`, `/my-bets`, and `/account` by ensuring robust data loading, handling all states (loading, empty, error), and correcting layout constraints.

## User Review Required

> [!IMPORTANT]
> This fix involves updating the layout shell and specific private routes. If you have custom CSS overrides for these pages, please verify them after the update.

## Proposed Changes

### 1. Layout & Shell Stability
- **`src/routes/__root.tsx`**: Add `min-h-[calc(100vh-48px)]` to the main `Outlet` container and ensure `pb-20` (padding bottom) is applied for mobile bottom navigation to prevent content from being hidden.
- **`src/routes/_authenticated/route.tsx`**: Maintain `ssr: false` but add a visible loading skeleton while checking the session to prevent "flash of white".

### 2. Route Hardening (Wallet, My Bets, Account)
- **`src/routes/_authenticated/wallet/index.tsx`**: 
  - Add `WalletSkeleton` for the balance card and transaction table.
  - Implement a dedicated "Carteira" header with subtext.
  - Ensure the balance card always shows "R$ 0,00" if data is missing.
  - Add summary cards for "Depositado", "Apostado", "Ganhos", "Sacado".
- **`src/routes/_authenticated/my-bets/index.tsx`**:
  - Add `BetsSkeleton`.
  - Ensure filters are always visible even if no tickets exist.
  - Implement "Você ainda não possui bilhetes" empty state with a "Ver Jogos" CTA.
- **`src/routes/_authenticated/account/index.tsx`**:
  - Add `AccountSkeleton`.
  - Ensure profile and stats cards render with "0" or "N/A" instead of returning `null`.

### 3. Data Flow & Security
- **Server Functions**: Audit `getWalletData` to ensure it returns a consistent shape even for new users.
- **Error Boundaries**: Wrap components in local error boundaries to show "Try Again" buttons rather than crashing the whole page.

## Technical Details

- **Skeleton Pattern**: Use `animate-pulse` and slate-based divs to match the high-density Navy theme.
- **Mobile First**: Use `sticky top-12` for sub-headers on mobile to maintain context while scrolling.
- **Null Safety**: Strict use of `Number(val || 0)` and `?.` operator across all financial displays.
