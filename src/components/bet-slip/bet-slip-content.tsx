import { useBetSlip } from "@/hooks/use-bet-slip";
import { Ticket, Trash2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { placeBet } from "@/lib/betting.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function BetSlipContent({ isDrawer = false }: { isDrawer?: boolean }) {
  const { selections, removeSelection, clearSlip, stake, setStake, setOpen } = useBetSlip();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const placeBetFn = useServerFn(placeBet);

  const totalOdd = selections.length > 0 ? selections.reduce((acc, s) => acc * s.odd, 1) : 0;
  const potentialReturn = totalOdd * stake;
  const potentialProfit = potentialReturn - stake;

  const handlePlaceBet = async () => {
    if (selections.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await placeBetFn({
        data: {
          selections: selections.map(s => ({
            fixtureId: s.fixtureId,
            marketName: s.marketName,
            selectionName: s.selectionName,
            odd: s.odd,
          })),
          stake,
          idempotencyKey: crypto.randomUUID(),
        }
      });
      toast.success(`Aposta realizada com sucesso! Código: ${result.ticketCode}`);
      clearSlip();
      if (isDrawer) setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar aposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="p-4 border-b flex items-center justify-between bg-slate-900 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-green-500" />
          <h2 className="font-bold uppercase tracking-tight text-sm">Bilhete de Aposta</h2>
        </div>
        <div className="flex items-center gap-2">
          {selections.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSlip}
              className="h-7 text-[10px] uppercase font-bold text-slate-400 hover:text-red-400 px-2"
            >
              Limpar
            </Button>
          )}
          {isDrawer && (
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 text-white hover:bg-slate-800">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {selections.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-8 opacity-40">
            <Ticket className="h-12 w-12 mb-2" />
            <p className="text-sm font-medium">Selecione uma cotação para começar seu bilhete</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selections.map((s) => (
              <div key={s.optionId} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 relative group">
                <button
                  onClick={() => removeSelection(s.optionId)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="text-[10px] font-black text-green-600 uppercase mb-1">{s.marketName}</div>
                <div className="text-xs font-bold truncate mb-1 text-slate-900 dark:text-white">{s.fixtureName}</div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">{s.optionName}</span>
                  <span className="text-sm font-black text-green-600">x{s.odd.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {selections.length > 0 && (
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-800/50 space-y-4 shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Cotação Total</span>
              <span className="text-slate-900 dark:text-white">{totalOdd.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-400">R$</span>
              <Input
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                className="h-10 font-black text-lg focus-visible:ring-green-500"
              />
            </div>
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lucro</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">R$ {potentialProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retorno</span>
              <span className="text-xl font-black text-green-600">R$ {potentialReturn.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            onClick={handlePlaceBet}
            disabled={isSubmitting || selections.length === 0}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black text-sm shadow-lg shadow-green-600/20 uppercase tracking-widest"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : "Apostar Agora"}
          </Button>
          
          {stake < 10 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 justify-center">
              <AlertCircle className="h-3 w-3" />
              <span>Aposta mínima R$ 10,00</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
