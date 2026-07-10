'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { NewChoferModal } from '@/components/choferes/NewChoferModal'

export function NewChoferButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        Nuevo Chofer
      </button>

      <NewChoferModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
