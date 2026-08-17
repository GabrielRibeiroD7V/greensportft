import { useBetSlip } from "@/hooks/use-bet-slip";
import { BetSlipContent } from "./bet-slip-content";

export function BetSlipSidebar() {
  const { selections } = useBetSlip();
  
  // Only render with full width if there are selections, otherwise compact
  const hasSelections = selections.length > 0;

  return (
    <aside className={`
      hidden lg:flex flex-col border-l bg-white dark:bg-slate-900 shadow-xl transition-all duration-300 shrink-0
      ${hasSelections ? 'w-80' : 'w-16'}
    `}>
      {hasSelections ? (
        <BetSlipContent />
      ) : (
        <div className="flex flex-col items-center py-6 gap-8 text-slate-300 dark:text-slate-700">
          <div className="[writing-mode:vertical-lr] rotate-180 font-black uppercase tracking-[0.3em] text-xs">
            Bilhete Vazio
          </div>
        </div>
      )}
    </aside>
  );
}
