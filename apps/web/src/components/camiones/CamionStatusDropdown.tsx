'use client'

import { useTransition } from 'react'
import { updateCamionStatusAction } from '@/app/dashboard/camiones/actions'
import { Loader2 } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  active: 'badge-success',
  in_maintenance: 'badge-warning',
  inactive: 'badge-default',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  in_maintenance: 'En Taller',
  inactive: 'Inactivo',
}

export function CamionStatusDropdown({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    
    startTransition(async () => {
      try {
        await updateCamionStatusAction(id, newStatus)
      } catch (error) {
        console.error('Error actualizando estado del camión', error)
      }
    })
  }

  if (isPending) {
    return (
      <span className={`badge ${STATUS_STYLES[currentStatus] || 'badge-default'} opacity-70 flex items-center gap-1.5 w-fit`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        {STATUS_LABELS[currentStatus] || currentStatus}...
      </span>
    )
  }

  return (
    <select
      value={currentStatus}
      onChange={handleStatusChange}
      disabled={isPending}
      className={`appearance-none text-center cursor-pointer badge ${STATUS_STYLES[currentStatus] || 'badge-default'} hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50`}
      title="Cambiar estado"
    >
      <option value="active">Activo</option>
      <option value="in_maintenance">En Taller</option>
      <option value="inactive">Inactivo</option>
    </select>
  )
}
