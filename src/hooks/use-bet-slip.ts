import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Fixture, Market, MarketOption } from '@/lib/types';
import { toast } from 'sonner';

export interface Selection {
  fixtureId: string;
  fixtureName: string;
  marketName: string;
  optionId: string;
  optionName: string;
  selectionName: string;
  odd: number;
}

interface BetSlipState {
  selections: Selection[];
  isOpen: boolean;
  stake: number;
  addSelection: (fixture: Fixture, market: Market, option: MarketOption) => void;
  removeSelection: (optionId: string) => void;
  clearSlip: () => void;
  setOpen: (open: boolean) => void;
  setStake: (stake: number) => void;
  toggleOpen: () => void;
}

export const useBetSlip = create<BetSlipState>()(
  persist(
    (set, get) => ({
      selections: [],
      isOpen: false,
      stake: 10,
      addSelection: (fixture, market, option) => {
        const { selections } = get();
        const exists = selections.find((s) => s.optionId === option.id);
        
        if (exists) {
          set({ selections: selections.filter((s) => s.optionId !== option.id) });
          return;
        }

        // Rule: Conflict detection (one selection per fixture)
        const sameFixtureSelections = selections.filter(s => s.fixtureId === fixture.id);
        if (sameFixtureSelections.length > 0) {
          toast.warning("Você já possui uma seleção para este jogo.");
          return;
        }

        const newSelection: Selection = {
          fixtureId: fixture.id,
          fixtureName: `${fixture.home_team_name} x ${fixture.away_team_name}`,
          marketName: market.name,
          optionId: option.id,
          optionName: option.name,
          selectionName: option.name,
          odd: option.odd,
        };

        set({ 
          selections: [...selections, newSelection],
          isOpen: true // Auto open when adding first or new
        });
      },
      removeSelection: (optionId) => {
        set((state) => ({
          selections: state.selections.filter((s) => s.optionId !== optionId)
        }));
      },
      clearSlip: () => set({ selections: [] }),
      setOpen: (open) => set({ isOpen: open }),
      setStake: (stake) => set({ stake }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'greensport-bet-slip',
    }
  )
);
