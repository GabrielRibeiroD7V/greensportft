import { useBetSlip } from "@/hooks/use-bet-slip";
import { BetSlipContent } from "./bet-slip-content";

export function BetSlipSidebar() {
  const { selections } = useBetSlip();
  
  if (selections.length === 0) return null;

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-xl">
      <BetSlipContent />
    </aside>
  );
}
