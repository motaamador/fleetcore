import type { Metadata } from 'next'
import { Wrench, AlertCircle, CheckCircle2, Clock, XCircle, Truck, CalendarClock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewMaintenanceButton } from '@/components/mantenimiento/NewMaintenanceButton'
import { EditMaintenanceButton } from '@/components/mantenimiento/EditMaintenanceButton'
import { DeleteMaintenanceButton } from '@/components/mantenimiento/DeleteMaintenanceButton'
import { MantenimientoTabs } from '@/components/mantenimiento/MantenimientoTabs'
import { MaintenanceStatusDropdown } from '@/components/mantenimiento/MaintenanceStatusDropdown'
import { SearchInput } from '@/components/ui/SearchInput'

export const metadata: Metadata = { title: 'Mantenimiento | FleetCore' }
export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  programado: { label: 'Programado',  badge: 'badge-default',  icon: Clock },
  en_proceso: { label: 'En Proceso',  badge: 'badge-warning',  icon: Wrench },
  completado: { label: 'Completado',  badge: 'badge-success',  icon: CheckCircle2 },
  cancelado:  { label: 'Cancelado',   badge: 'badge-danger',   icon: XCircle },
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  preventivo: { label: 'Preventivo',  color: 'text-info-text bg-info-bg' },
  correctivo: { label: 'Correctivo',  color: 'text-warning-text bg-warning-bg' },
  revision:   { label: 'Revisión',    color: 'text-primary-700 bg-primary-50' },
  emergencia: { label: 'Emergencia',  color: 'text-danger bg-danger-bg' },
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', VES: 'Bs.' }

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCost(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  return `${symbol} ${new Intl.NumberFormat('es-VE').format(amount)}`
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function MantenimientoPage({ searchParams }: { searchParams?: { query?: string, tab?: string } }) {
  const supabase = createClient()

  const query = searchParams?.query || ''
  const tab = searchParams?.tab || 'pendientes'
  
  let queryBuilder = supabase
      .from('maintenance_records')
      .select(`
        *,
        vehicles!inner(plate_number, make, model, status)
      `)
      
  if (tab === 'pendientes') {
    queryBuilder = queryBuilder.in('status', ['programado', 'en_proceso'])
  } else if (tab === 'completados') {
    queryBuilder = queryBuilder.in('status', ['completado', 'cancelado'])
  }
      
  if (query) {
    queryBuilder = queryBuilder.or(`description.ilike.%${query}%,vehicles.plate_number.ilike.%${query}%`)
  }
  
  const [
    { data: records },
    { data: vehicles },
  ] = await Promise.all([
    queryBuilder.order('scheduled_date', { ascending: false }),
    supabase
      .from('vehicles')
      .select('id, plate_number, make, model')
      .order('plate_number'),
  ])

  const safeRecords  = records || []
  const safeVehicles = vehicles || []

  // KPIs
  const totalRecords     = safeRecords.length
  const inProcess        = safeRecords.filter(r => r.status === 'en_proceso').length
  const scheduled        = safeRecords.filter(r => r.status === 'programado').length
  const completed        = safeRecords.filter(r => r.status === 'completado').length
  const totalCostUSD     = safeRecords
    .filter(r => r.status === 'completado' && r.currency === 'USD')
    .reduce((sum, r) => sum + (r.cost || 0), 0)

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Mantenimiento de Flota</h1>
          <p className="page-subtitle">Historial de servicios, talleres y control de costos de mantenimiento.</p>
        </div>
        <NewMaintenanceButton vehicles={safeVehicles} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-warning-bg">
            <Wrench className="w-5 h-5 text-warning-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">En Taller</p>
            <p className="text-2xl font-bold text-text-primary">{inProcess}</p>
            <p className="text-xs text-text-muted mt-1">{scheduled} programados</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Completados</p>
            <p className="text-2xl font-bold text-text-primary">{completed}</p>
            <p className="text-xs text-text-muted mt-1">de {totalRecords} totales</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-primary-50">
            <Truck className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Vehículos</p>
            <p className="text-2xl font-bold text-text-primary">{safeVehicles.length}</p>
            <p className="text-xs text-text-muted mt-1">en la flota</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <CalendarClock className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Costo Total (USD)</p>
            <p className="text-xl font-bold text-text-primary">
              ${new Intl.NumberFormat('en-US').format(totalCostUSD)}
            </p>
            <p className="text-xs text-text-muted mt-1">servicios completados</p>
          </div>
        </div>
      </div>

      <MantenimientoTabs />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por placa o descripción..." />
        <button className="btn-secondary flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Tabla */}
      {safeRecords.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-warning-bg flex items-center justify-center mb-4">
            <Wrench className="w-7 h-7 text-warning-text" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">Sin registros de mantenimiento</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Registra el primer servicio de la flota usando el botón "Registrar Servicio".
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="table-header">Vehículo</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Descripción</th>
                <th className="table-header">Taller</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Costo</th>
                <th className="table-header">Estado</th>
                <th className="table-header text-right"></th>
              </tr>
            </thead>
            <tbody>
              {safeRecords.map(record => {
                const statusCfg = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.programado
                const typeCfg   = TYPE_CONFIG[record.type]     ?? { label: record.type, color: 'badge-default' }
                const StatusIcon = statusCfg.icon

                return (
                  <tr key={record.id} className="table-row">

                    {/* Vehículo */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-warning-bg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4 h-4 text-warning-text" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary font-mono">
                            {record.vehicles?.plate_number || '—'}
                          </p>
                          <p className="text-xs text-text-muted">
                            {record.vehicles?.make} {record.vehicles?.model}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="table-cell">
                      <span className={`badge text-xs ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* Descripción */}
                    <td className="table-cell max-w-[200px]">
                      <p className="text-sm text-text-primary line-clamp-2">{record.description}</p>
                    </td>

                    {/* Taller */}
                    <td className="table-cell">
                      <p className="text-sm text-text-secondary">{record.workshop || '—'}</p>
                    </td>

                    {/* Fecha */}
                    <td className="table-cell">
                      <p className="text-sm text-text-primary">{formatDate(record.scheduled_date)}</p>
                      {record.completed_date && (
                        <p className="text-xs text-text-muted">Completado: {formatDate(record.completed_date)}</p>
                      )}
                    </td>

                    {/* Costo */}
                    <td className="table-cell">
                      <p className="text-sm font-semibold text-text-primary">
                        {record.cost > 0 ? formatCost(record.cost, record.currency) : '—'}
                      </p>
                    </td>

                    {/* Estado */}
                    <td className="table-cell">
                      <MaintenanceStatusDropdown id={record.id} currentStatus={record.status} />
                    </td>

                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EditMaintenanceButton record={record} vehicles={safeVehicles} />
                        <DeleteMaintenanceButton id={record.id} />
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
