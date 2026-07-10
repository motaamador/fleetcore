'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { NewClientModal } from './NewClientModal'

export function NewClientButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        Nuevo Cliente
      </button>

      <NewClientModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
