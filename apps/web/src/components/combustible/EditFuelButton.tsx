'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditFuelModal } from '@/components/combustible/EditFuelModal'

export function EditFuelButton({ record, vehicles, drivers }: { record: any, vehicles: any[], drivers: any[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar registro">
        <Pencil className="w-4 h-4" />
      </button>
      <EditFuelModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} record={record} vehicles={vehicles} drivers={drivers} />
    </>
  )
}
