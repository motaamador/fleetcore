'use client'

import { useTransition } from 'react'
import { updateTripStatusAction } from '@/app/dashboard/fletes/actions'
import { Loader2 } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  completed:  'badge-success',
  in_transit: 'badge bg-primary-50 text-primary-700',
  scheduled:  'badge-warning',
  cancelled:  'badge-danger',
}

const STATUS_LABELS: Record<string, string> = {
  completed:  'Completado',
  in_transit: 'En Tránsito',
  scheduled:  'Programado',
  cancelled:  'Cancelado',
}

export function TripStatusDropdown({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    
    startTransition(async () => {
      try {
        await updateTripStatusAction(id, newStatus)
      } catch (error) {
        console.error('Error actualizando estado', error)
      }
    })
  }

  if (isPending) {
    return (
      <span className={`badge ${STATUS_STYLES[currentStatus] || 'badge-default'} opacity-70 flex items-center gap-1.5 w-fit`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        {STATUS_LABELS[currentStatus]}...
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
      <option value="scheduled">Programado</option>
      <option value="in_transit">En Tránsito</option>
      <option value="completed">Completado</option>
      <option value="cancelled">Cancelado</option>
    </select>
  )
}
