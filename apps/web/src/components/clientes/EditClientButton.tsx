'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditClientModal } from '@/components/clientes/EditClientModal'

export function EditClientButton({ client }: { client: any }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar cliente">
        <Pencil className="w-4 h-4" />
      </button>
      <EditClientModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} client={client} />
    </>
  )
}
