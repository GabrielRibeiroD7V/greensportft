import { useBetSlip } from "@/hooks/use-bet-slip";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BetSlipButton() {
  const { selections, toggleOpen, isOpen } = useBetSlip();
  
  if (selections.length === 0) return null;

  return (
    <Button
      onClick={toggleOpen}
      className={`
        fixed bottom-6 right-6 lg:hidden z-50 h-14 px-6 rounded-full shadow-2xl bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-widest flex gap-3 items-center border-2 border-green-500
        ${isOpen ? 'hidden' : 'flex'}
      `}
    >
      <div className="relative">
        <Ticket className="h-6 w-6 text-green-500" />
        <span className="absolute -top-2 -right-2 bg-green-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
          {selections.length}
        </span>
      </div>
      <span>Bilhete</span>
    </Button>
  );
}
