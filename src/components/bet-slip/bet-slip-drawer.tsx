import { useBetSlip } from "@/hooks/use-bet-slip";
import { BetSlipContent } from "./bet-slip-content";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function BetSlipDrawer() {
  const { isOpen, setOpen } = useBetSlip();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="p-0 h-[80vh] sm:h-[600px] border-t-0 rounded-t-2xl overflow-hidden bg-white dark:bg-slate-900">
        <SheetTitle className="sr-only">Bilhete de Aposta</SheetTitle>
        <BetSlipContent isDrawer />
      </SheetContent>
    </Sheet>
  );
}
