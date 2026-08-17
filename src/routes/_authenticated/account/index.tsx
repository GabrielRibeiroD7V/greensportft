import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/account/')({
  component: AccountPage,
})

function AccountPage() {
  return <div className="p-8 text-slate-500 italic">Área da Conta em construção.</div>
}
