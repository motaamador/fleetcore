'use client'

import { useTransition } from 'react'
import { updateMaintenanceStatusAction } from '@/app/dashboard/mantenimiento/actions'
import { Loader2 } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  programado: { label: 'Programado',  badge: 'badge-default' },
  en_proceso: { label: 'En Proceso',  badge: 'badge-warning' },
  completado: { label: 'Completado',  badge: 'badge-success' },
  cancelado:  { label: 'Cancelado',   badge: 'badge-danger' },
}

export function MaintenanceStatusDropdown({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    
    startTransition(async () => {
      try {
        await updateMaintenanceStatusAction(id, newStatus)
      } catch (error) {
        console.error('Error actualizando estado', error)
      }
    })
  }

  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.programado

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
      <option value="programado">Programado</option>
      <option value="en_proceso">En Proceso</option>
      <option value="completado">Completado</option>
      <option value="cancelado">Cancelado</option>
    </select>
  )
}
