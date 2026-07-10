'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteObra } from '@/app/dashboard/obras/actions'

interface DeleteObraButtonProps {
  id: string
  name: string
}

export function DeleteObraButton({ id, name }: DeleteObraButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation() // Prevent opening the edit modal if we click delete

    if (!window.confirm(`¿Estás seguro de eliminar la obra "${name}"?\nEsta acción no se puede deshacer.`)) {
      return
    }

    startTransition(async () => {
      try {
        await deleteObra(id)
      } catch (err: any) {
        alert(`No se pudo eliminar la obra: ${err.message}`)
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50"
      title="Eliminar obra"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
