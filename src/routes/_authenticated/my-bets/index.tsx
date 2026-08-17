import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/my-bets')({
  component: MyBetsPage,
})

function MyBetsPage() {
  return <div className="p-8 text-slate-500 italic">Meus Bilhetes em construção.</div>
}
