import type { Metadata } from 'next'
import { Truck, Plus, Search, Filter, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewCamionButton } from '@/components/camiones/NewCamionButton'
import { EditCamionButton } from '@/components/camiones/EditCamionButton'
import { DeleteCamionButton } from '@/components/camiones/DeleteCamionButton'
import { CamionesTabs } from '@/components/camiones/CamionesTabs'
import { CamionStatusDropdown } from '@/components/camiones/CamionStatusDropdown'
import { SearchInput } from '@/components/ui/SearchInput'
import type { Vehicle } from '@fleetcore/types'

export const metadata: Metadata = { title: 'Gestión de Camiones | FleetCore' }
export const dynamic = 'force-dynamic'

// Datos de prueba como Fallback (por si Supabase aún no está configurado en .env.local)
const mockVehicles: Partial<Vehicle>[] = [
  { id: '1', plate_number: 'TRK-001', make: 'Volvo', model: 'VNL 860', year: 2022, type: 'truck', capacity_kg: 36000, status: 'active', current_mileage: 125000 },
  { id: '2', plate_number: 'MAC-001', make: 'Caterpillar', model: '320 Excavator', year: 2021, type: 'heavy_machinery', capacity_kg: undefined, status: 'active', current_mileage: 4500 },
  { id: '3', plate_number: 'VAN-001', make: 'Ford', model: 'Transit 350', year: 2023, type: 'van', capacity_kg: 2000, status: 'active', current_mileage: 12000 },
  { id: '4', plate_number: 'TRK-002', make: 'Kenworth', model: 'T680', year: 2020, type: 'truck', capacity_kg: 35000, status: 'in_maintenance', current_mileage: 210000 },
  { id: '5', plate_number: 'TRK-003', make: 'Peterbilt', model: '579', year: 2019, type: 'truck', capacity_kg: 34000, status: 'inactive', current_mileage: 350000 },
]

export default async function CamionesPage({
  searchParams,
}: {
  searchParams?: { query?: string, tab?: string }
}) {
  const supabase = createClient()
  const query = searchParams?.query || ''
  const tab = searchParams?.tab || 'activos'
  
  let queryBuilder = supabase.from('vehicles').select('*')
  
  if (tab === 'activos') {
    queryBuilder = queryBuilder.eq('status', 'active')
  } else if (tab === 'mantenimiento') {
    queryBuilder = queryBuilder.in('status', ['in_maintenance', 'inactive'])
  }

  if (query) {
    queryBuilder = queryBuilder.or(`plate_number.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`)
  }

  const { data: dbVehicles, error } = await queryBuilder.order('created_at', { ascending: false })

  // Si hay error (ej. falta configurar variables de entorno), usamos la mock data
  const vehicles = error || !dbVehicles ? mockVehicles : dbVehicles as Partial<Vehicle>[]
  const isUsingMockData = !!error;
  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Camiones y Maquinaria</h1>
          <p className="page-subtitle">Administra tu flota de vehículos, mantenimiento y disponibilidad.</p>
        </div>
        <NewCamionButton />
      </div>

      {isUsingMockData && (
        <div className="bg-warning-bg border border-warning/20 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-warning-text">Supabase no conectado</h4>
            <p className="text-xs text-warning-text/80 mt-1">
              No se detectaron variables de entorno o la conexión falló. Se están mostrando datos de prueba de manera temporal. Revisa tu archivo <code className="font-mono bg-warning/10 px-1 rounded">.env.local</code>.
            </p>
          </div>
        </div>
      )}

      <CamionesTabs />

      {/* Toolbar (Buscador y Filtros) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por placa, marca o modelo..." />
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="table-header">Vehículo</th>
              <th className="table-header">Placa</th>
              <th className="table-header">Tipo</th>
              <th className="table-header">Capacidad</th>
              <th className="table-header">Estado</th>
              <th className="table-header text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center flex-shrink-0 border border-border">
                      <Truck className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-text-muted">Año {vehicle.year} • {vehicle.current_mileage?.toLocaleString()} km</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell font-semibold tracking-wide">{vehicle.plate_number}</td>
                <td className="table-cell capitalize text-text-secondary">
                  {vehicle.type === 'heavy_machinery' ? 'Maquinaria' : vehicle.type}
                </td>
                <td className="table-cell text-text-secondary">
                  {vehicle.capacity_kg ? `${(vehicle.capacity_kg / 1000).toFixed(1)} Ton` : 'N/A'}
                </td>
                <td className="table-cell">
                  <CamionStatusDropdown id={vehicle.id!} currentStatus={vehicle.status || 'inactive'} />
                </td>
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EditCamionButton vehiculo={vehicle as Vehicle} />
                    <DeleteCamionButton id={vehicle.id as string} plate={vehicle.plate_number as string} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
