import type { Metadata } from 'next'
import { Map, MapPin, Truck, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FleetMap } from '@/components/telemetria/FleetMap'
import { SimulatorButton } from '@/components/telemetria/SimulatorButton'
import type { Vehicle } from '@fleetcore/types'

export const metadata: Metadata = { title: 'Mapa GPS | FleetCore' }
export const dynamic = 'force-dynamic'

export default async function MapaPage() {
  const supabase = createClient()

  // Obtener vehículos con sus coordenadas
  const { data: dbVehicles } = await supabase
    .from('vehicles')
    .select('*')
    .neq('status', 'inactive')
    
  const vehicles = (dbVehicles as Vehicle[]) || []
  
  // Estadísticas rápidas
  const active = vehicles.filter(v => v.status === 'active').length
  const available = active // or we can just use active
  const maintenance = vehicles.filter(v => v.status === 'in_maintenance').length
  const withoutGPS = vehicles.filter(v => !v.current_lat || !v.current_lng).length

  return (
    <div className="animate-fade-in space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      
      {/* Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Map className="w-6 h-6 text-primary" /> 
            Centro de Control GPS
          </h1>
          <p className="page-subtitle">Monitoreo satelital de la flota en tiempo real.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <SimulatorButton />
        </div>
      </div>

      {/* Leyenda y Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-3 rounded-lg flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0 border border-success/20">
            <Truck className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Activos</p>
            <p className="text-lg font-bold text-text-primary">{active}</p>
          </div>
        </div>
        <div className="bg-surface border border-border p-3 rounded-lg flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 border border-primary/20">
            <MapPin className="w-4 h-4 text-primary-700" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Totales</p>
            <p className="text-lg font-bold text-text-primary">{vehicles.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-border p-3 rounded-lg flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-warning-bg flex items-center justify-center flex-shrink-0 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Mantenimiento</p>
            <p className="text-lg font-bold text-text-primary">{maintenance}</p>
          </div>
        </div>
        <div className="bg-surface border border-border p-3 rounded-lg flex items-center gap-3 shadow-sm opacity-60">
          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center flex-shrink-0 border border-border-strong">
            <Map className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Sin Señal GPS</p>
            <p className="text-lg font-bold text-text-primary">{withoutGPS}</p>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 min-h-[500px]">
        <FleetMap vehicles={vehicles} />
      </div>

    </div>
  )
}
