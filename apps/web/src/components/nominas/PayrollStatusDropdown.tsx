'use client'

import { useTransition } from 'react'
import { updatePayrollStatusAction } from '@/app/dashboard/nominas/actions'
import { Loader2 } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  borrador: { label: 'Borrador', badge: 'badge-default' },
  aprobado: { label: 'Aprobado', badge: 'badge-warning' },
  pagado:   { label: 'Pagado',   badge: 'badge-success' },
  anulado:  { label: 'Anulado',  badge: 'badge-danger' },
}

export function PayrollStatusDropdown({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    
    startTransition(async () => {
      try {
        await updatePayrollStatusAction(id, newStatus)
      } catch (error) {
        console.error('Error actualizando estado', error)
      }
    })
  }

  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.borrador

  if (isPending) {
    return (
      <span className={`badge ${statusCfg.badge} opacity-70 flex items-center gap-1.5 w-fit`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        {statusCfg.label}...
      </span>
    )
  }

  return (
    <select
      value={currentStatus}
      onChange={handleStatusChange}
      disabled={isPending}
      className={`appearance-none text-center cursor-pointer badge ${statusCfg.badge} hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50`}
      title="Cambiar estado"
    >
      <option value="borrador">Borrador</option>
      <option value="aprobado">Aprobado</option>
      <option value="pagado">Pagado</option>
      <option value="anulado">Anulado</option>
    </select>
  )
}
