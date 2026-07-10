'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollText } from 'lucide-react'
import { NewContractModal } from './NewContractModal'

interface Client { id: string; name: string }

export function NewContractButton({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <ScrollText className="w-4 h-4" />
        Nuevo Contrato
      </button>

      <NewContractModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        clients={clients}
      />
    </>
  )
}
