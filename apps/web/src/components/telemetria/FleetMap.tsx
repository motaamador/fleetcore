'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { Vehicle } from '@fleetcore/types'

// SSR Disabled para evitar el error "window is not defined" de Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <span className="text-sm font-medium text-slate-500">Cargando mapa de telemetría...</span>
    </div>
  )
})

export function FleetMap({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div className="w-full h-[650px] bg-slate-100 rounded-xl border border-border shadow-sm overflow-hidden relative z-0">
      <MapComponent vehicles={vehicles} />
    </div>
  )
}
