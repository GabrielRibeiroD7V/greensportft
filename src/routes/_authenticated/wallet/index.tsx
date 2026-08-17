import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/wallet/')({
  component: WalletPage,
})

function WalletPage() {
  return <div className="p-8 text-slate-500 italic">Wallet em construção.</div>
}
