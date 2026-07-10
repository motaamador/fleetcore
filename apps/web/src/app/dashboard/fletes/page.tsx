import type { Metadata } from 'next'
import { Plus, Search, Filter, MapPin, Truck, CalendarClock, Edit2, AlertCircle, HardHat, ArrowRight, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Trip } from '@fleetcore/types'

export const metadata: Metadata = { title: 'Fletes y Rutas | FleetCore' }
export const dynamic = 'force-dynamic'

// ── Mock data — refleja la estructura real de Supabase con JOINs ──────────────
const mockTrips: Trip[] = [
  {
    id: '1',
    project_id: 'p1',
    origin: 'Planta Central, Valencia',
    destination: 'Autopista Norte Km 18',
    distance_km: 145,
    status: 'in_transit',
    departure_time: new Date().toISOString(),
    created_at: '', updated_at: '',
    vehicles:   { plate_number: 'TRK-001', make: 'Volvo',    model: 'VNL 860' },
    profiles:   { full_name: 'Carlos Mendoza' },
    projects:   { id: 'p1', name: 'Autopista Norte Fase 2', location: 'Km 18, Ruta 001' },
    trip_stops: [
      { id: 's1', trip_id: '1', stop_order: 1, location: 'Depósito Maracay', stop_type: 'loading',   created_at: '', updated_at: '' },
      { id: 's2', trip_id: '1', stop_order: 2, location: 'Almacén Valencia Norte', stop_type: 'unloading', created_at: '', updated_at: '' },
    ],
  },
  {
    id: '2',
    project_id: 'p2',
    origin: 'Almacén Principal, Caracas',
    destination: 'Condominio Las Brisas',
    distance_km: 42.5,
    status: 'completed',
    departure_time: '2026-07-07T08:00:00Z',
    created_at: '', updated_at: '',
    vehicles:   { plate_number: 'VAN-001', make: 'Ford',     model: 'Transit' },
    profiles:   { full_name: 'Luis Fernández' },
    projects:   { id: 'p2', name: 'Condominio Las Brisas', location: 'Baruta, Miranda' },
    trip_stops: [],
  },
  {
    id: '3',
    project_id: undefined, // Traslado interno — sin obra
    origin: 'Mina Norte',
    destination: 'Planta Central, Valencia',
    distance_km: 300,
    status: 'scheduled',
    departure_time: undefined,
    created_at: '', updated_at: '',
    vehicles:   { plate_number: 'TRK-002', make: 'Kenworth', model: 'T680' },
    profiles:   { full_name: 'Pedro Gómez' },
    projects:   null,
    trip_stops: [
      { id: 's3', trip_id: '3', stop_order: 1, location: 'Báscula Nortecentro', stop_type: 'loading',   created_at: '', updated_at: '' },
      { id: 's4', trip_id: '3', stop_order: 2, location: 'Refinería El Palito', stop_type: 'unloading', created_at: '', updated_at: '' },
      { id: 's5', trip_id: '3', stop_order: 3, location: 'Terminal Valencia',   stop_type: 'loading',   created_at: '', updated_at: '' },
    ],
  },
  {
    id: '4',
    project_id: 'p3',
    origin: 'Centro de Distribución',
    destination: 'Puerto Cabello',
    distance_km: 210,
    status: 'cancelled',
    departure_time: undefined,
    created_at: '', updated_at: '',
    vehicles:   { plate_number: 'TRK-003', make: 'Peterbilt', model: '579' },
    profiles:   { full_name: 'Andrés Silva' },
    projects:   { id: 'p3', name: 'Expansión Puerto Cabello', location: 'Puerto Cabello, Carabobo' },
    trip_stops: [],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Construye el array de nodos de la ruta en orden: Origen → paradas → Destino */
function buildRouteNodes(trip: Trip): string[] {
  const stops = [...(trip.trip_stops ?? [])].sort((a, b) => a.stop_order - b.stop_order)
  return [
    trip.origin,
    ...stops.map((s) => s.location),
    trip.destination,
  ]
}

const STATUS_STYLES: Record<string, string> = {
  completed:  'badge-success',
  in_transit: 'bg-primary-50 text-primary-700',
  scheduled:  'badge-warning',
  cancelled:  'badge-danger',
}
const STATUS_LABELS: Record<string, string> = {
  completed:  'Completado',
  in_transit: 'En Tránsito',
  scheduled:  'Programado',
  cancelled:  'Cancelado',
}
const STOP_TYPE_LABELS: Record<string, string> = {
  loading:   'Carga',
  unloading: 'Descarga',
}

import { NewFleteButton } from '@/components/fletes/NewFleteButton'
import { DeleteFleteButton } from '@/components/fletes/DeleteFleteButton'
import { TripStatusDropdown } from '@/components/fletes/TripStatusDropdown'
import { FletesTabs } from '@/components/fletes/FletesTabs'
import { SearchInput } from '@/components/ui/SearchInput'
import { ExportButton } from '@/components/ui/ExportButton'

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function FletesPage({ searchParams }: { searchParams?: { query?: string, tab?: string } }) {
  const supabase = createClient()

  // Ejecutamos consultas en paralelo para alimentar la tabla y el formulario modal
  const [
    { data: dbTrips, error },
    { data: dbProjects },
    { data: dbVehicles },
    { data: dbDrivers },
  ] = await Promise.all([
    (async () => {
      const query = searchParams?.query || ''
      const tab = searchParams?.tab || 'activos'
      
      let q = supabase
        .from('trips')
        .select(`
          *,
          projects(id, name, location),
          vehicles!inner(plate_number, make, model),
          profiles!driver_id(full_name),
          trip_stops(id, stop_order, location, stop_type, arrived_at, notes)
        `)

      if (tab === 'activos') {
        q = q.in('status', ['scheduled', 'in_transit'])
      } else if (tab === 'historial') {
        q = q.in('status', ['completed', 'cancelled'])
      }
      
      if (query) {
        q = q.or(`origin.ilike.%${query}%,destination.ilike.%${query}%,vehicles.plate_number.ilike.%${query}%`)
      }
      return q.order('created_at', { ascending: false })
    })(),
    supabase.from('projects').select('id, name, location').order('name'),
    supabase.from('vehicles').select('id, plate_number, make, model').in('status', ['active', 'in_maintenance']),
    supabase.from('profiles').select('id, full_name').in('role', ['driver', 'dispatcher']).eq('is_active', true)
  ])

  const trips: Trip[]  = (error || !dbTrips) ? mockTrips : (dbTrips as Trip[])
  const isUsingMockData = !!error

  // Formatear data plana para el CSV
  const exportData = trips.map(t => ({
    'ID Flete': `FLT-${t.id.substring(0,6).toUpperCase()}`,
    'Obra': t.projects?.name || 'Traslado Interno',
    'Origen': t.origin,
    'Destino': t.destination,
    'Paradas': (t.trip_stops || []).length,
    'Estado': STATUS_LABELS[t.status] || t.status,
    'Conductor': t.profiles?.full_name || 'Sin asignar',
    'Placa Vehículo': t.vehicles?.plate_number || 'N/A',
    'Distancia (km)': t.distance_km || 0,
    'Fecha Salida': t.departure_time ? new Date(t.departure_time).toLocaleDateString('es-ES') : 'Pendiente'
  }))

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hojas de Ruta y Fletes</h1>
          <p className="page-subtitle">Control de viajes, despachos y rutas de carga/descarga.</p>
        </div>
        <NewFleteButton 
          projects={dbProjects || []} 
          vehicles={dbVehicles || []} 
          drivers={dbDrivers || []} 
        />
      </div>

      {/* Banner de Fallback */}
      {isUsingMockData && (
        <div className="bg-warning-bg border border-warning/20 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-warning-text">Supabase no conectado</h4>
            <p className="text-xs text-warning-text/80 mt-1">
              Mostrando datos de prueba. Configura tu <code className="font-mono bg-warning/10 px-1 rounded">.env.local</code> con las credenciales de Supabase.
            </p>
          </div>
        </div>
      )}

      {/* Navegación por pestañas */}
      <FletesTabs />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por origen, destino o placa..." />
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename={`Reporte_Fletes_${new Date().toISOString().split('T')[0]}`} />
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr>
              <th className="table-header">Ruta</th>
              <th className="table-header">Obra</th>
              <th className="table-header">Estado</th>
              <th className="table-header">Conductor y Vehículo</th>
              <th className="table-header">Distancia</th>
              <th className="table-header">Salida</th>
              <th className="table-header text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => {
              const routeNodes = buildRouteNodes(trip)
              const stopCount  = (trip.trip_stops ?? []).length

              return (
                <tr key={trip.id} className="table-row">

                  {/* ── Ruta: Origen → [paradas] → Destino ── */}
                  <td className="table-cell max-w-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-info-bg flex items-center justify-center flex-shrink-0 border border-info/20 mt-0.5">
                        <MapPin className="w-4 h-4 text-info" />
                      </div>
                      <div className="min-w-0">
                        {/* Visualización del camino completo */}
                        <div className="flex flex-wrap items-center gap-0.5">
                          {routeNodes.map((node, idx) => (
                            <span key={idx} className="flex items-center gap-0.5">
                              <span
                                className={`text-xs font-medium leading-tight ${
                                  idx === 0
                                    ? 'text-text-primary'
                                    : idx === routeNodes.length - 1
                                    ? 'text-primary-700 font-semibold'
                                    : 'text-text-secondary'
                                }`}
                              >
                                {node}
                              </span>
                              {idx < routeNodes.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-text-muted flex-shrink-0" />
                              )}
                            </span>
                          ))}
                        </div>
                        {/* ID + indicador de paradas */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-muted font-mono">
                            FLT-{trip.id.substring(0, 6).toUpperCase()}
                          </span>
                          {stopCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-background border border-border rounded-full px-1.5 py-0.5">
                              <Package className="w-3 h-3" />
                              {stopCount} {stopCount === 1 ? 'parada' : 'paradas'}
                            </span>
                          )}
                        </div>
                        {/* Tooltip de paradas con tipo carga/descarga */}
                        {stopCount > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {[...(trip.trip_stops ?? [])]
                              .sort((a, b) => a.stop_order - b.stop_order)
                              .map((stop) => (
                                <div key={stop.id} className="flex items-center gap-1.5">
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    stop.stop_type === 'loading' ? 'bg-primary-light' : 'bg-warning'
                                  }`} />
                                  <span className="text-xs text-text-muted">
                                    <span className="font-medium text-text-secondary">{STOP_TYPE_LABELS[stop.stop_type]}</span>
                                    {' · '}{stop.location}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ── Obra ── */}
                  <td className="table-cell">
                    {trip.projects ? (
                      <div className="flex items-start gap-2">
                        <HardHat className="w-4 h-4 text-primary-light flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-text-primary leading-tight">
                            {trip.projects.name}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">{trip.projects.location}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted italic">Traslado interno</span>
                    )}
                  </td>

                  {/* ── Estado ── */}
                  <td className="table-cell">
                    <TripStatusDropdown id={trip.id} currentStatus={trip.status} />
                  </td>

                  {/* ── Conductor y Vehículo ── */}
                  <td className="table-cell">
                    <p className="text-sm font-medium text-text-primary">
                      {trip.profiles?.full_name ?? 'Sin asignar'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {trip.vehicles
                        ? `${trip.vehicles.plate_number} · ${trip.vehicles.make}`
                        : '—'}
                    </p>
                  </td>

                  {/* ── Distancia ── */}
                  <td className="table-cell text-sm text-text-secondary">
                    {trip.distance_km ? `${trip.distance_km} km` : '—'}
                  </td>

                  {/* ── Salida ── */}
                  <td className="table-cell">
                    {trip.departure_time ? (
                      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <CalendarClock className="w-4 h-4 text-text-muted" />
                        {new Date(trip.departure_time).toLocaleDateString('es-ES', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-text-muted flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4 opacity-40" />
                        Pendiente
                      </span>
                    )}
                  </td>

                  {/* ── Acciones ── */}
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded transition-colors" title="Gestionar Flete">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <DeleteFleteButton id={trip.id} />
                    </div>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
