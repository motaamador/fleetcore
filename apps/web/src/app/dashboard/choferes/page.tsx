import type { Metadata } from 'next'
import { Users, Search, Filter, Phone, Truck, CheckCircle2, XCircle, AlertCircle, UserPlus, CreditCard, Printer } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@fleetcore/types'
import { NewChoferButton } from '@/components/choferes/NewChoferButton'
import { EditChoferButton } from '@/components/choferes/EditChoferButton'
import { DeleteChoferButton } from '@/components/choferes/DeleteChoferButton'
import { ChoferesTabs } from '@/components/choferes/ChoferesTabs'
import { ChoferStatusDropdown } from '@/components/choferes/ChoferStatusDropdown'
import { SearchInput } from '@/components/ui/SearchInput'

export const metadata: Metadata = { title: 'Choferes | FleetCore' }
export const dynamic = 'force-dynamic'

// ── Tipos para la consulta con conteo de viajes ─────────────────────────────
type DriverRow = Profile & {
  trips_count: number
}

// ── Mock data (fallback mientras no haya choferes registrados) ───────────────
const mockDrivers: DriverRow[] = [
  {
    id: '1', role: 'driver', full_name: 'Carlos Mendoza',
    phone_number: '0412-555-0101', cedula_identidad: 'V-15123456', licencia_tipo: '5ta', is_active: true,
    trips_count: 14, created_at: '', updated_at: '',
  },
  {
    id: '2', role: 'driver', full_name: 'Luis Fernández',
    phone_number: '0414-555-0202', cedula_identidad: 'V-18765432', licencia_tipo: '4ta', is_active: true,
    trips_count: 9, created_at: '', updated_at: '',
  },
  {
    id: '3', role: 'driver', full_name: 'Pedro Gómez',
    phone_number: '0424-555-0303', cedula_identidad: 'V-22345678', licencia_tipo: '5ta', is_active: true,
    trips_count: 21, created_at: '', updated_at: '',
  },
  {
    id: '4', role: 'driver', full_name: 'Andrés Silva',
    phone_number: '0416-555-0404', cedula_identidad: 'V-12987654', licencia_tipo: '3ra', is_active: false,
    trips_count: 5, created_at: '', updated_at: '',
  },
]

const ROLE_LABELS: Record<string, string> = {
  driver:     'Conductor',
  dispatcher: 'Despachador',
  admin:      'Administrador',
  finance:    'Finanzas',
}
const ROLE_STYLES: Record<string, string> = {
  driver:     'badge-default',
  dispatcher: 'bg-primary-50 text-primary-700',
  admin:      'badge-danger',
  finance:    'badge-success',
}

// ── Iniciales para el avatar ─────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

// ── Avatar color por índice ──────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-primary-100 text-primary-700',
  'bg-success-bg text-success-text',
  'bg-warning-bg text-warning-text',
  'bg-info-bg text-info-text',
  'bg-danger-bg text-danger',
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ChoferesPage({
  searchParams,
}: {
  searchParams?: { query?: string, tab?: string }
}) {
  const supabase = createClient()
  const query = searchParams?.query || ''
  const tab = searchParams?.tab || 'activos'

  // Obtener choferes y despachadores con conteo de viajes asignados
  let queryBuilder = supabase
    .from('profiles')
    .select(`
      *,
      trips_count:trips(count)
    `)
    .in('role', ['driver', 'dispatcher'])

  if (tab === 'activos') {
    queryBuilder = queryBuilder.eq('is_active', true)
  } else if (tab === 'inactivos') {
    queryBuilder = queryBuilder.eq('is_active', false)
  }

  if (query) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,cedula_identidad.ilike.%${query}%,phone_number.ilike.%${query}%`)
  }

  const { data: dbDrivers, error } = await queryBuilder.order('full_name')

  // Normalizar la respuesta de Supabase (el count viene como array)
  const normalizeDrivers = (raw: any[]): DriverRow[] =>
    raw.map((d) => ({
      ...d,
      trips_count: Array.isArray(d.trips_count)
        ? (d.trips_count[0]?.count ?? 0)
        : 0,
    }))

  const drivers: DriverRow[] =
    error || !dbDrivers || dbDrivers.length === 0
      ? mockDrivers
      : normalizeDrivers(dbDrivers)

  const activeCount        = drivers.filter((d) => d.is_active).length
  const inactiveCount      = drivers.filter((d) => !d.is_active).length
  const driverOnlyCount    = drivers.filter((d) => d.role === 'driver').length

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Choferes y Personal</h1>
          <p className="page-subtitle">Gestión de conductores, despachadores y asignación de viajes.</p>
        </div>
        <NewChoferButton />
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Total Conductores</p>
            <p className="text-xl font-bold text-text-primary">{driverOnlyCount}</p>
          </div>
        </div>
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success-bg flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Activos</p>
            <p className="text-xl font-bold text-text-primary">{activeCount}</p>
          </div>
        </div>
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger-bg flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Inactivos</p>
            <p className="text-xl font-bold text-text-primary">{inactiveCount}</p>
          </div>
        </div>
      </div>

      <ChoferesTabs />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por nombre, cédula o teléfono..." />
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr>
              <th className="table-header">Chofer</th>
              <th className="table-header">Documentos</th>
              <th className="table-header">Teléfono</th>
              <th className="table-header">Viajes Asignados</th>
              <th className="table-header">Estado</th>
              <th className="table-header text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, idx) => (
              <tr key={driver.id} className="table-row">

                {/* Avatar + Nombre */}
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                      {getInitials(driver.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{driver.full_name}</p>
                      <p className="text-xs text-text-muted font-mono">
                        ID: {driver.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Documentos (CI y Licencia) */}
                <td className="table-cell">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-sm text-text-primary">
                      <CreditCard className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <span className="font-medium">{driver.cedula_identidad || 'Sin C.I.'}</span>
                    </div>
                    {driver.licencia_tipo && (
                      <span className="text-xs text-text-muted ml-5">
                        Licencia {driver.licencia_tipo}
                      </span>
                    )}
                  </div>
                </td>

                {/* Teléfono */}
                <td className="table-cell">
                  {driver.phone_number ? (
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <Phone className="w-3.5 h-3.5 text-text-muted" />
                      {driver.phone_number}
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted">—</span>
                  )}
                </td>

                {/* Viajes */}
                <td className="table-cell">
                  <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <Truck className="w-3.5 h-3.5 text-text-muted" />
                    <span className="font-semibold text-text-primary">{driver.trips_count}</span>
                    <span className="text-text-muted">viajes</span>
                  </div>
                </td>

                {/* Estado */}
                <td className="table-cell">
                  <ChoferStatusDropdown id={driver.id} isActive={driver.is_active} />
                </td>

                {/* Acciones */}
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/dashboard/choferes/${driver.id}/reporte`}
                      className="btn-icon text-text-secondary hover:text-primary-700 hover:bg-primary-50"
                      title="Imprimir Relación de Viajes"
                    >
                      <Printer className="w-4 h-4" />
                    </Link>
                    <EditChoferButton chofer={driver as Profile} />
                    <DeleteChoferButton id={driver.id as string} name={driver.full_name as string} />
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
