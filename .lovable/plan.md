# Sportsbook UI/UX Overhaul Plan

Transform the GreenSport public interface into a professional football-only sportsbook with high information density, navy-themed styling, and professional layouts while preserving existing functional navigation and logic.

## Technical Details
- **Theme Updates**: Enforce `bg-slate-900` (Navy) for structural components (Header, Sidebar, Bet Slip headers) and high-density white cards for content.
- **Components**: 
    - Create `src/components/football/match-list-grouped.tsx` for league-grouped fixture display.
    - Update `MatchCardCompact` for maximum density (1/X/2 odds in a single row).
    - Update `BetSlipSidebar` to include "empty" states and summary sections as specified.
- **Layout**: Refine `src/routes/football.tsx` for 3-column desktop (230px | flex:1 | 330px) and layer-based mobile view.
- **Navigation**: Sync all links with TanStack Router typed search params (`tab`, `competition`, `q`).

## Proposed Changes

### 1. Global Layout & Header
- **src/routes/__root.tsx**: 
    - Update `Header` to be more compact (14px/16px height).
    - Implement professional search bar with "Buscar time, campeonato ou partida".
    - Add user balance and quick links (Minhas Apostas, Carteira) to the desktop header.
- **src/components/layout/bottom-nav.tsx**: Add active state highlighting based on current URL params.

### 2. Sidebar Redesign (Desktop & Mobile Drawer)
- **src/routes/football.tsx** & **src/components/layout/mobile-drawer.tsx**:
    - Implement structured sections: EXPLORAR, MINHA ÁREA, PRINCIPAIS LIGAS, CONTA.
    - Add match count badges to league names where available.
    - Remove Admin link for non-admin users.

### 3. Football Feed Density
- **src/routes/football.tsx**:
    - Add "Futebol" context header with total match count.
    - Implement "Atalhos Horizontais" (Ao Vivo, Hoje, Top Leagues) with scrollable mobile view.
    - Group list by Competition with logo and country info.
- **src/components/football/match-card-highlight.tsx**: 
    - Desktop: Up to 3 cards side-by-side.
    - Mobile: Carousel with partial visibility of next card.

### 4. Match & Market Presentation
- **src/components/football/match-card-compact.tsx**:
    - Reduce vertical padding and font sizes for high density.
    - Standardize 1/X/2 odd buttons with GreenSport "Selected" state.
    - Add "LIVE" badge with pulse and elapsed time (if available).
- **src/routes/football/match.$fixtureId.tsx**:
    - Refine scoreboard visual.
    - Categorize markets (Gols, Escanteios, etc.) using tabs.
    - Display markets in compact rows (e.g., Over/Under pairs).

### 5. Bet Slip Enhancements
- **src/components/bet-slip/bet-slip-sidebar.tsx**:
    - Add compact "Selecione uma cotação" empty state.
    - Implement summary section with Stake, Payout, and "APOSTAR AGORA" CTA.
- **src/components/bet-slip/bet-slip-drawer.tsx**:
    - Ensure Sheet/Drawer preserves state and has a clear close mechanism.

### 6. Validation & Stability
- Run `bun run build` to verify no regressions in TypeScript or SSR.
- Audit all navigation deep-links to ensure `tab` and `competition` params persist correctly.
