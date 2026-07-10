'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditChoferModal } from '@/components/choferes/EditChoferModal'
import type { Profile } from '@fleetcore/types'

export function EditChoferButton({ chofer }: { chofer: Profile }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors"
        title="Editar perfil"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <EditChoferModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        chofer={chofer}
      />
    </>
  )
}
