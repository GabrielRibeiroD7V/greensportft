import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/finance/')({
  component: AdminFinancePage,
})

function AdminFinancePage() {
  return <div className="p-8 text-slate-500 italic">Financeiro Admin em construção.</div>
}
