'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditContractModal } from '@/components/contratos/EditContractModal'

export function EditContractButton({ contract, clients }: { contract: any, clients: any[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar contrato">
        <Pencil className="w-4 h-4" />
      </button>
      <EditContractModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} contract={contract} clients={clients} />
    </>
  )
}
