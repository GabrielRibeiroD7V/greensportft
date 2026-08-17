import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/settings/')({
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  return <div className="p-8 text-slate-500 italic">Configurações Admin em construção.</div>
}
