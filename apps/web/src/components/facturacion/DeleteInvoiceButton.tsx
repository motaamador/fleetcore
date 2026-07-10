'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteInvoiceAction } from '@/app/dashboard/facturacion/actions'

export function DeleteInvoiceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de eliminar esta factura?`)) return
    startTransition(async () => {
      try { await deleteInvoiceAction(id) }
      catch (err: any) { alert(`Error al eliminar: ${err.message}`) }
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50" title="Eliminar factura">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
