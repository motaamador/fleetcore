'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { EditFleteModal } from './EditFleteModal'
import type { Project, Vehicle, Profile, Trip, TripStop } from '@fleetcore/types'

interface EditFleteButtonProps {
  trip:     Trip & { trip_stops?: TripStop[] }
  projects: Pick<Project, 'id' | 'name' | 'location'>[]
  vehicles: Pick<Vehicle, 'id' | 'plate_number' | 'make' | 'model'>[]
  drivers:  Pick<Profile, 'id' | 'full_name'>[]
  bcvRate: number | null
}

export function EditFleteButton({ trip, projects, vehicles, drivers, bcvRate }: EditFleteButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Editar flete"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-warning-text hover:bg-warning-bg transition-colors"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      {open && (
        <EditFleteModal
          open={open}
          onClose={() => setOpen(false)}
          trip={trip}
          projects={projects}
          vehicles={vehicles}
          drivers={drivers}
          bcvRate={bcvRate}
        />
      )}
    </>
  )
}
