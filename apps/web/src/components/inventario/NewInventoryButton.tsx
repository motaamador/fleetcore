'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { NewInventoryModal } from './NewInventoryModal'

export function NewInventoryButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus className="w-4 h-4" /> Nuevo Artículo
      </button>
      <NewInventoryModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} />
    </>
  )
}
