import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, Mail, MessageSquare, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Suporte ao Cliente</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Estamos aqui para ajudar você</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest">
              <MessageSquare className="h-5 w-5 text-green-500" /> Chat Ao Vivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Fale com nossos atendentes em tempo real. Disponível 24 horas por dia, 7 dias por semana.
            </p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-lg uppercase tracking-widest text-xs transition-all">
              Iniciar Chat
            </button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              <Mail className="h-5 w-5 text-green-500" /> E-mail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Envie sua dúvida para nossa equipe e responderemos em até 24 horas.
            </p>
            <div className="text-sm font-black text-green-600 select-all">
              suporte@greensport.com
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 px-1">Perguntas Frequentes</h2>
        <div className="space-y-2">
          {[
            "Como realizar um depósito via Pix?",
            "Quanto tempo demora o saque?",
            "Esqueci minha senha, o que fazer?",
            "Como funcionam as apostas múltiplas?"
          ].map((q, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:border-green-500 transition-colors cursor-pointer group">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{q}</span>
              <HelpCircle className="h-4 w-4 text-slate-300 group-hover:text-green-500 transition-colors" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
