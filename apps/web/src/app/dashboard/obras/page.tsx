import type { Metadata } from 'next'
import { Search, Filter, HardHat, MapPin, CalendarDays, DollarSign,
         AlertCircle, CheckCircle2, Clock, PauseCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewObraButton } from '@/components/obras/NewObraButton'
import { EditObraButton } from '@/components/obras/EditObraButton'
import { DeleteObraButton } from '@/components/obras/DeleteObraButton'
import { ObrasTabs } from '@/components/obras/ObrasTabs'
import { ObraStatusDropdown } from '@/components/obras/ObraStatusDropdown'
import { SearchInput } from '@/components/ui/SearchInput'
import type { Project, Currency } from '@fleetcore/types'

export const metadata: Metadata = { title: 'Obras y Proyectos | FleetCore' }
export const dynamic = 'force-dynamic'

// ── Tipo con conteo de fletes ────────────────────────────────────────────────
type ProjectRow = Project & { trips_count: number }

// ── Mock data ────────────────────────────────────────────────────────────────
const mockProjects: ProjectRow[] = [
  {
    id: 'p1', name: 'Autopista Norte Fase 2',
    description: 'Ampliación de carriles y pavimentación. Tramo 42 km.',
    location: 'Km 18, Ruta 001 — Sector Norte',
    client_name: 'Ministerio de Infraestructura',
    budget: 5000000, currency: 'USD', status: 'active',
    start_date: '2026-03-01', end_date: '2026-12-31',
    created_at: '', updated_at: '', trips_count: 14,
  },
  {
    id: 'p2', name: 'Condominio Las Brisas',
    description: 'Movimiento de tierras y cimentación de 8 torres.',
    location: 'Baruta, Edo. Miranda',
    client_name: 'Constructora Horizonte C.A.',
    budget: 1200000, currency: 'USD', status: 'active',
    start_date: '2026-05-15', end_date: '2027-06-30',
    created_at: '', updated_at: '', trips_count: 6,
  },
  {
    id: 'p3', name: 'Expansión Puerto Cabello',
    description: 'Ampliación de muelles e instalaciones portuarias.',
    location: 'Puerto Cabello, Edo. Carabobo',
    client_name: 'Autoridad Única de Área Puerto Cabello',
    budget: 7500000, currency: 'EUR', status: 'active',
    start_date: '2026-01-10', end_date: '2027-03-15',
    created_at: '', updated_at: '', trips_count: 22,
  },
  {
    id: 'p4', name: 'Viaducto Río Tuy',
    description: 'Construcción de viaducto de 380 metros sobre el Río Tuy.',
    location: 'Ocumare del Tuy, Edo. Miranda',
    client_name: 'Gobernación del Estado Miranda',
    budget: 2500000000, currency: 'VES', status: 'planning',
    start_date: '2026-09-01', end_date: '2028-01-31',
    created_at: '', updated_at: '', trips_count: 0,
  },
  {
    id: 'p5', name: 'Planta Industrial Zona Franca',
    description: 'Construcción de galpón industrial de 12,000 m².',
    location: 'Zona Industrial, Valencia, Edo. Carabobo',
    client_name: 'Inversiones del Centro C.A.',
    budget: 950000, currency: 'USD', status: 'on_hold',
    start_date: '2026-04-01', end_date: '2026-11-30',
    created_at: '', updated_at: '', trips_count: 3,
  },
]

// ── Helpers de moneda ────────────────────────────────────────────────────────
const CURRENCY_CONFIG: Record<Currency, { symbol: string; locale: string; iso: string }> = {
  USD: { symbol: '$',   locale: 'en-US', iso: 'USD' },
  EUR: { symbol: '€',   locale: 'de-DE', iso: 'EUR' },
  VES: { symbol: 'Bs.', locale: 'es-VE', iso: 'VES' },
}

function formatBudget(amount: number, currency: Currency): string {
  const { locale, iso, symbol } = CURRENCY_CONFIG[currency]
  if (currency === 'VES') {
    // VES no es ISO soportado en todos los browsers, formatear manualmente
    return `${symbol} ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 0 }).format(amount)}`
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency: iso,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

// ── Helpers de estado ────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  active:    'badge-success',
  planning:  'badge-warning',
  completed: 'badge-default',
  on_hold:   'badge-danger',
}
const STATUS_LABELS: Record<string, string> = {
  active:    'Activo',
  planning:  'En Planificación',
  completed: 'Completado',
  on_hold:   'En Pausa',
}
const STATUS_ICONS: Record<string, React.ElementType> = {
  active:    CheckCircle2,
  planning:  Clock,
  completed: CheckCircle2,
  on_hold:   PauseCircle,
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ObrasPage({
  searchParams,
}: {
  searchParams?: { query?: string, tab?: string }
}) {
  const supabase = createClient()
  const query = searchParams?.query || ''
  const tab = searchParams?.tab || 'activas'

  let queryBuilder = supabase
    .from('projects')
    .select(`*, trips_count:trips(count)`)

  if (tab === 'activas') {
    queryBuilder = queryBuilder.in('status', ['active', 'planning'])
  } else if (tab === 'inactivas') {
    queryBuilder = queryBuilder.in('status', ['completed', 'on_hold'])
  }

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,client_name.ilike.%${query}%,location.ilike.%${query}%`)
  }

  const { data: dbProjects, error } = await queryBuilder.order('created_at', { ascending: false })

  if (error) {
    console.error("Supabase Error en Obras:", error)
  }

  const normalize = (raw: any[]): ProjectRow[] =>
    raw.map((p) => ({
      ...p,
      currency: (p.currency ?? 'USD') as Currency,
      trips_count: Array.isArray(p.trips_count)
        ? (p.trips_count[0]?.count ?? 0) : 0,
    }))

  const projects: ProjectRow[] =
    error || !dbProjects ? mockProjects : normalize(dbProjects)

  const isUsingMockData = !!error

  const activeCount   = projects.filter((p) => p.status === 'active').length
  const planningCount = projects.filter((p) => p.status === 'planning').length
  const totalBudgetUSD = projects
    .filter((p) => p.currency === 'USD')
    .reduce((s, p) => s + (p.budget ?? 0), 0)

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Obras y Proyectos</h1>
          <p className="page-subtitle">Catálogo de obras atendidas y seguimiento de fletes por proyecto.</p>
        </div>
        {/* Botón con modal integrado (Client Component) */}
        <NewObraButton />
      </div>

      {/* Banner fallback */}
      {isUsingMockData && (
        <div className="bg-warning-bg border border-warning/20 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-warning-text">Supabase no conectado</h4>
            <p className="text-xs text-warning-text/80 mt-1">Mostrando datos de prueba temporalmente.</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <HardHat className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Obras Activas</p>
            <p className="text-xl font-bold text-text-primary">{activeCount}</p>
          </div>
        </div>
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-bg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-warning-text" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">En Planificación</p>
            <p className="text-xl font-bold text-text-primary">{planningCount}</p>
          </div>
        </div>
        <div className="card-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success-bg flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Presupuesto (USD)</p>
            <p className="text-xl font-bold text-text-primary">
              {formatBudget(totalBudgetUSD, 'USD')}
            </p>
          </div>
        </div>
      </div>

      <ObrasTabs />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por nombre, cliente o ubicación..." />
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
              <th className="table-header">Obra / Proyecto</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Ubicación</th>
              <th className="table-header">Presupuesto</th>
              <th className="table-header">Fletes</th>
              <th className="table-header">Fechas</th>
              <th className="table-header">Estado</th>
              <th className="table-header text-right"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const StatusIcon = STATUS_ICONS[project.status] ?? CheckCircle2
              const currencyConfig = CURRENCY_CONFIG[project.currency ?? 'USD']
              return (
                <tr key={project.id} className="table-row cursor-pointer">

                  {/* Obra */}
                  <td className="table-cell">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 border border-primary/10 mt-0.5">
                        <HardHat className="w-4 h-4 text-primary-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="table-cell">
                    <p className="text-sm text-text-primary font-medium">{project.client_name ?? '—'}</p>
                  </td>

                  {/* Ubicación */}
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <span className="line-clamp-1">{project.location}</span>
                    </div>
                  </td>

                  {/* Presupuesto con moneda */}
                  <td className="table-cell">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatBudget(project.budget ?? 0, project.currency ?? 'USD')}
                    </p>
                    <span className="inline-flex items-center mt-0.5 text-xs font-medium text-text-muted
                      bg-background border border-border rounded px-1.5 py-0.5">
                      {project.currency ?? 'USD'}
                    </span>
                  </td>

                  {/* Fletes */}
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-text-muted" />
                      <span className="font-semibold text-text-primary">{project.trips_count}</span>
                      <span className="text-text-muted">fletes</span>
                    </div>
                  </td>

                  {/* Fechas */}
                  <td className="table-cell">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <CalendarDays className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <span>{formatDate(project.start_date)}</span>
                      {project.end_date && (
                        <><span className="text-text-muted mx-0.5">→</span>
                        <span>{formatDate(project.end_date)}</span></>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="table-cell">
                    <ObraStatusDropdown id={project.id} currentStatus={project.status} />
                  </td>

                  {/* Acciones */}
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditObraButton obra={project} />
                      <DeleteObraButton id={project.id} name={project.name} />
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
