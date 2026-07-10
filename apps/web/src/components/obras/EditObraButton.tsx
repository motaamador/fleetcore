'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditObraModal } from '@/components/obras/EditObraModal'
import type { Project } from '@fleetcore/types'

export function EditObraButton({ obra }: { obra: Project }) {
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
        title="Editar obra"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <EditObraModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        obra={obra}
      />
    </>
  )
}
