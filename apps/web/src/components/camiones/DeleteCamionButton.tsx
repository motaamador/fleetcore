'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteCamion } from '@/app/dashboard/camiones/actions'

interface DeleteCamionButtonProps {
  id: string
  plate: string
}

export function DeleteCamionButton({ id, plate }: DeleteCamionButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()

    if (!window.confirm(`¿Estás seguro de eliminar el vehículo "${plate}"?\nEsta acción no se puede deshacer y puede fallar si tiene fletes asociados.`)) {
      return
    }

    startTransition(async () => {
      try {
        await deleteCamion(id)
      } catch (err: any) {
        alert(`No se pudo eliminar el vehículo: ${err.message}`)
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50"
      title="Eliminar vehículo"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
