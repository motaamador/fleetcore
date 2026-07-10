'use client'

import { useTransition } from 'react'
import { updateInvoiceStatusAction } from '@/app/dashboard/facturacion/actions'
import { Loader2 } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  borrador:  { label: 'Borrador',  badge: 'badge-default' },
  emitida:   { label: 'Emitida',   badge: 'bg-info-bg text-info-text' },
  pagada:    { label: 'Pagada',    badge: 'badge-success' },
  cancelada: { label: 'Cancelada', badge: 'badge-danger' },
}

export function InvoiceStatusDropdown({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    
    startTransition(async () => {
      try {
        await updateInvoiceStatusAction(id, newStatus)
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
      <option value="emitida">Emitida</option>
      <option value="pagada">Pagada</option>
      <option value="cancelada">Cancelada</option>
    </select>
  )
}
