'use client'

import { useTransition } from 'react'
import { updateChoferStatusAction } from '@/app/dashboard/choferes/actions'
import { Loader2 } from 'lucide-react'

export function ChoferStatusDropdown({ id, isActive }: { id: string, isActive: boolean }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIsActive = e.target.value === 'true'
    if (newIsActive === isActive) return
    
    startTransition(async () => {
      try {
        await updateChoferStatusAction(id, newIsActive)
      } catch (error) {
        console.error('Error actualizando estado del chofer', error)
      }
    })
  }

  if (isPending) {
    return (
      <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'} opacity-70 flex items-center gap-1.5 w-fit`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        {isActive ? 'Activo' : 'Inactivo'}...
      </span>
    )
  }

  return (
    <select
      value={isActive ? 'true' : 'false'}
      onChange={handleStatusChange}
      disabled={isPending}
      className={`appearance-none text-center cursor-pointer badge ${isActive ? 'badge-success' : 'badge-danger'} hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50`}
      title="Cambiar estado"
    >
      <option value="true">Activo</option>
      <option value="false">Inactivo</option>
    </select>
  )
}
