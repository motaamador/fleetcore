'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteChofer } from '@/app/dashboard/choferes/actions'

interface DeleteChoferButtonProps {
  id: string
  name: string
}

export function DeleteChoferButton({ id, name }: DeleteChoferButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()

    if (!window.confirm(`¿Estás seguro de eliminar el perfil de "${name}"?\nEsta acción no se puede deshacer y puede fallar si tiene fletes asociados.`)) {
      return
    }

    startTransition(async () => {
      try {
        await deleteChofer(id)
      } catch (err: any) {
        alert(`No se pudo eliminar el chofer: ${err.message}`)
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50"
      title="Eliminar perfil"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
