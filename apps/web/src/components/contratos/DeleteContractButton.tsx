'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteContractAction } from '@/app/dashboard/contratos/actions'

interface DeleteContractButtonProps {
  id: string
  title: string
}

export function DeleteContractButton({ id, title }: DeleteContractButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(`¿Estás seguro de eliminar el contrato "${title}"?\nEsta acción no se puede deshacer.`)) {
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('contracts').delete().eq('id', id)
      
      if (error) {
        alert(`No se pudo eliminar el contrato: ${error.message}`)
        return
      }

      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50"
      title="Eliminar contrato"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
