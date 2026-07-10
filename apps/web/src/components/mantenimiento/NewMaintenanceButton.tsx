'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench } from 'lucide-react'
import { NewMaintenanceModal } from './NewMaintenanceModal'

interface Vehicle { id: string; plate_number: string; make: string; model: string }

export function NewMaintenanceButton({ vehicles }: { vehicles: Vehicle[] }) {
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
        <Wrench className="w-4 h-4" />
        Registrar Servicio
      </button>

      <NewMaintenanceModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        vehicles={vehicles}
      />
    </>
  )
}
