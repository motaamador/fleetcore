'use client'

import { useTransition } from 'react'
import { updateObraStatusAction } from '@/app/dashboard/obras/actions'
import { Loader2 } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  active:    'badge-success',
  planning:  'badge-warning',
  completed: 'badge-default',
  on_hold:   'badge-danger',
}
const STATUS_LABELS: Record<string, string> = {
  active:    'Activo',
  planning:  'En Planificación',
  completed: 'Completado',
  on_hold:   'En Pausa',
}

export function ObraStatusDropdown({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus === currentStatus) return
    
    startTransition(async () => {
      try {
        await updateObraStatusAction(id, newStatus)
      } catch (error) {
        console.error('Error actualizando estado', error)
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
      <option value="planning">En Planificación</option>
      <option value="active">Activo</option>
      <option value="on_hold">En Pausa</option>
      <option value="completed">Completado</option>
    </select>
  )
}
