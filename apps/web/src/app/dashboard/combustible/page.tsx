import type { Metadata } from 'next'
import { Fuel, Droplet, DollarSign, Activity, Truck, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewFuelButton } from '@/components/combustible/NewFuelButton'
import { EditFuelButton } from '@/components/combustible/EditFuelButton'
import { DeleteFuelButton } from '@/components/combustible/DeleteFuelButton'
import { SearchInput } from '@/components/ui/SearchInput'
import { ExportButton } from '@/components/ui/ExportButton'

export const metadata: Metadata = { title: 'Control de Combustible | FleetCore' }
export const dynamic = 'force-dynamic'

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', VES: 'Bs.' }

function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] || currency
  return `${sym} ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(amount)}`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function CombustiblePage({ searchParams }: { searchParams?: { query?: string } }) {
  const supabase = createClient()

  const query = searchParams?.query || ''
  
  let queryBuilder = supabase
    .from('fuel_records')
    .select(`
      *,
      vehicles!inner(plate_number, make, model),
      profiles!driver_id(full_name)
    `)
    
  if (query) {
    queryBuilder = queryBuilder.or(`station_name.ilike.%${query}%,vehicles.plate_number.ilike.%${query}%`)
  }
  
  const { data: records, error: fetchError } = await queryBuilder.order('date', { ascending: false })

  if (fetchError) {
    console.error('Error fetching fuel records:', fetchError)
  }

  // Obtener catálogos para el modal
  const [
    { data: vehicles },
    { data: drivers }
  ] = await Promise.all([
    supabase.from('vehicles').select('id, plate_number, make, model').order('plate_number'),
    supabase.from('profiles').select('id, full_name, role').in('role', ['driver', 'dispatcher']).order('full_name')
  ])

  const safeRecords  = records || []
  const safeVehicles = vehicles || []
  const safeDrivers  = drivers || []

  // KPIs
  const totalLiters = safeRecords.reduce((sum, r) => sum + (r.liters || 0), 0)
  const totalCostUSD = safeRecords
    .filter(r => r.currency === 'USD')
    .reduce((sum, r) => sum + (r.cost || 0), 0)
  
  const totalCostAll = safeRecords.reduce((sum, r) => sum + (r.cost || 0), 0)
  const avgCostPerLiter = totalLiters > 0 ? (totalCostAll / totalLiters) : 0

  // Formatear data para CSV
  const exportData = safeRecords.map(r => ({
    'Fecha': r.date ? new Date(r.date).toLocaleDateString('es-ES') : '',
    'Estación': r.station_name || 'Sin estación',
    'Vehículo (Placa)': r.vehicles?.plate_number || '',
    'Chofer': r.profiles?.full_name || '',
    'Litros': r.liters || 0,
    'Costo Total': r.cost || 0,
    'Moneda': r.currency || 'USD',
    'Odómetro (km)': r.odometer || 0
  }))

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Combustible</h1>
          <p className="page-subtitle">Seguimiento de consumos, gastos y rendimiento por vehículo.</p>
        </div>
        <NewFuelButton vehicles={safeVehicles} drivers={safeDrivers} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-danger-bg">
            <Fuel className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Cargas Registradas</p>
            <p className="text-2xl font-bold text-text-primary">{safeRecords.length}</p>
            <p className="text-xs text-text-muted mt-1">historial total</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-info-bg">
            <Droplet className="w-5 h-5 text-info-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Litros Consumidos</p>
            <p className="text-2xl font-bold text-text-primary">
              {new Intl.NumberFormat('es-VE').format(totalLiters)} L
            </p>
            <p className="text-xs text-text-muted mt-1">volumen global</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <DollarSign className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Gasto Total (USD)</p>
            <p className="text-xl font-bold text-text-primary">
              ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(totalCostUSD)}
            </p>
            <p className="text-xs text-text-muted mt-1">solo consumos en dólares</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-primary-50">
            <Activity className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Costo Promedio / Litro</p>
            <p className="text-xl font-bold text-text-primary">
              {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(avgCostPerLiter)}
            </p>
            <p className="text-xs text-text-muted mt-1">global multimoneda</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por placa o estación..." />
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename={`Combustible_${new Date().toISOString().split('T')[0]}`} />
          <button className="btn-secondary flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      {safeRecords.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-danger-bg flex items-center justify-center mb-4">
            <Fuel className="w-7 h-7 text-danger" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">Sin registros de combustible</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Lleva el control de cada suministro de diésel o gasolina con el botón superior.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="table-header">Vehículo</th>
                <th className="table-header">Fecha y Estación</th>
                <th className="table-header">Chofer</th>
                <th className="table-header text-right">Litros</th>
                <th className="table-header text-right">Costo Total</th>
                <th className="table-header text-right">Odómetro</th>
                <th className="table-header text-right"></th>
              </tr>
            </thead>
            <tbody>
              {safeRecords.map(record => {
                const v = record.vehicles
                return (
                  <tr key={record.id} className="table-row">

                    {/* Vehículo */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-background-muted flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4 h-4 text-text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary font-mono">
                            {v?.plate_number || '—'}
                          </p>
                          <p className="text-xs text-text-muted">
                            {v?.make} {v?.model}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Fecha y Estación */}
                    <td className="table-cell">
                      <p className="text-sm font-medium text-text-primary">{formatDate(record.date)}</p>
                      {record.station_name ? (
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {record.station_name}
                        </p>
                      ) : (
                        <p className="text-xs text-text-muted mt-0.5">Sin estación</p>
                      )}
                    </td>

                    {/* Chofer */}
                    <td className="table-cell">
                      <p className="text-sm text-text-primary">
                        {record.profiles?.full_name || '—'}
                      </p>
                    </td>

                    {/* Litros */}
                    <td className="table-cell text-right">
                      <span className="badge badge-default">
                        {new Intl.NumberFormat('es-VE').format(record.liters)} L
                      </span>
                    </td>

                    {/* Costo */}
                    <td className="table-cell text-right">
                      <p className="text-sm font-bold text-text-primary">
                        {formatMoney(record.cost, record.currency)}
                      </p>
                    </td>

                    {/* Odómetro */}
                    <td className="table-cell text-right">
                      {record.odometer ? (
                        <p className="text-sm text-text-secondary font-mono">
                          {new Intl.NumberFormat('es-VE').format(record.odometer)} km
                        </p>
                      ) : <span className="text-text-muted">—</span>}
                    </td>

                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EditFuelButton record={record} vehicles={safeVehicles} drivers={safeDrivers} />
                        <DeleteFuelButton id={record.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
