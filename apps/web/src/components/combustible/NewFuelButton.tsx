'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Fuel } from 'lucide-react'
import { NewFuelModal } from './NewFuelModal'

interface Vehicle { id: string; plate_number: string; make: string; model: string }
interface Driver { id: string; full_name: string; role: string }

export function NewFuelButton({ vehicles, drivers }: { vehicles: Vehicle[], drivers: Driver[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Fuel className="w-4 h-4" />
        Registrar Carga
      </button>

      <NewFuelModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        vehicles={vehicles}
        drivers={drivers}
      />
    </>
  )
}
