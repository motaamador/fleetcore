'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { NewFleteModal } from '@/components/fletes/NewFleteModal'
import type { Project, Vehicle, Profile } from '@fleetcore/types'

interface NewFleteButtonProps {
  projects: Pick<Project, 'id' | 'name' | 'location'>[]
  vehicles: Pick<Vehicle, 'id' | 'plate_number' | 'make' | 'model'>[]
  drivers: Pick<Profile, 'id' | 'full_name'>[]
  bcvRate: number | null
}

export function NewFleteButton({ projects, vehicles, drivers, bcvRate }: NewFleteButtonProps) {
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
        <Plus className="w-4 h-4" />
        Nuevo Flete
      </button>

      <NewFleteModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        projects={projects}
        vehicles={vehicles}
        drivers={drivers}
        bcvRate={bcvRate}
      />
    </>
  )
}
