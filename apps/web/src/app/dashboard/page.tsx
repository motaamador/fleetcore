import {
  Truck, MapPin, HardHat, DollarSign,
  TrendingUp, TrendingDown, AlertTriangle,
  Clock, CheckCircle2, Circle, Activity, Minus, Package
} from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MonthlyFinanceChart, TripsByProjectChart } from '@/components/reportes/Charts'

export const metadata: Metadata = { title: 'Dashboard | FleetCore' }

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

function trendIcon(pct: number, invertColors = false) {
  if (Math.abs(pct) < 1) return { icon: Minus,        color: 'text-text-muted',   label: 'Sin cambio' }
  if (pct > 0) return           { icon: TrendingUp,    color: invertColors ? 'text-danger-text' : 'text-success-text', label: `+${pct.toFixed(0)}%` }
  return                        { icon: TrendingDown,  color: invertColors ? 'text-success-text' : 'text-danger-text', label: `${pct.toFixed(0)}%` }
}

const statusIcon: Record<string, React.ReactNode> = {
  info:    <Circle className="w-2 h-2 fill-primary-light text-primary-light" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-warning" />,
  success: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = createClient()

  const now       = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth      = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  // 1. Obtener datos reales de Supabase en paralelo
  const [
    { data: vehicles },
    { data: allTrips },
    { data: projects },
    { data: recentTrips },
    { data: recentTx },
    { data: allTx },
    // Conteos del mes actual para comparativa
    { count: tripsThisMonth },
    { count: tripsLastMonth },
    { data: invoicesThisMonth },
    { data: invoicesLastMonth },
    { data: overdueInvoicesData },
    { data: inventoryData },
    { data: maintenanceData },
  ] = await Promise.all([
    supabase.from('vehicles').select('id, status'),
    supabase.from('trips').select('id, status, projects(name)'),
    supabase.from('projects').select('id, status, budget, currency'),
    supabase.from('trips')
      .select('id, status, destination, created_at, profiles!driver_id(full_name)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('transactions')
      .select('id, type, amount, description, created_at')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('transactions')
      .select('amount, type, created_at')
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString()),
    // Viajes completados este mes
    supabase.from('trips').select('id', { count: 'exact', head: true })
      .eq('status', 'completed').gte('created_at', startOfCurrentMonth),
    // Viajes completados mes anterior
    supabase.from('trips').select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', startOfLastMonth)
      .lte('created_at', endOfLastMonth),
    // Ingresos este mes (facturas pagadas)
    supabase.from('invoices').select('total')
      .eq('status', 'pagada').gte('issued_at', startOfCurrentMonth.split('T')[0]),
    // Ingresos mes anterior
    supabase.from('invoices').select('total')
      .eq('status', 'pagada')
      .gte('issued_at', startOfLastMonth.split('T')[0])
      .lte('issued_at', endOfLastMonth.split('T')[0]),
    // Alertas
    supabase.from('invoices')
      .select('id, invoice_num, client_name, due_at, total, currency')
      .eq('status', 'emitida')
      .lte('due_at', now.toISOString().split('T')[0])
      .order('due_at', { ascending: true }),
    supabase.from('inventory_items')
      .select('id, name, quantity, min_quantity, unit'),
    supabase.from('maintenance_records')
      .select('id, description, scheduled_date, vehicles(plate_number)')
      .eq('status', 'programado')
      .lte('scheduled_date', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true }),
  ])

  // 2. Calcular KPIs base
  const safeVehicles = vehicles || []
  const safeTrips    = allTrips || []
  const safeProjects = projects || []

  const activeVehicles = safeVehicles.filter(v => v.status === 'active').length
  const totalVehicles  = safeVehicles.length

  const tripsInTransit = safeTrips.filter(t => t.status === 'in_transit').length
  const tripsScheduled = safeTrips.filter(t => t.status === 'scheduled').length

  const activeProjects = safeProjects.filter(p => p.status === 'active').length
  const totalProjects  = safeProjects.length

  const budgetUSD = safeProjects
    .filter(p => p.currency === 'USD')
    .reduce((sum, p) => sum + (p.budget || 0), 0)

  // 3. Calcular tendencias reales
  const ingresosEste   = (invoicesThisMonth  || []).reduce((s, i) => s + (i.total || 0), 0)
  const ingresosAnterior = (invoicesLastMonth || []).reduce((s, i) => s + (i.total || 0), 0)
  const ingresosTrend  = ingresosAnterior > 0
    ? ((ingresosEste - ingresosAnterior) / ingresosAnterior) * 100
    : ingresosEste > 0 ? 100 : 0

  const tripsCurr = tripsThisMonth  ?? 0
  const tripsLast = tripsLastMonth  ?? 0
  const tripsTrend = tripsLast > 0
    ? ((tripsCurr - tripsLast) / tripsLast) * 100
    : tripsCurr > 0 ? 100 : 0
    
  // 3.5 Alertas (Facturas vencidas, Stock bajo, Mantenimiento)
  const overdueInvoices = overdueInvoicesData || []
  const lowStockItems = (inventoryData || []).filter(i => i.quantity <= i.min_quantity && i.min_quantity > 0)
  const upcomingMaintenance = maintenanceData || []
  
  const hasAlerts = overdueInvoices.length > 0 || lowStockItems.length > 0 || upcomingMaintenance.length > 0

  // 4. KPI Cards con datos reales
  const kpis = [
    {
      label:      'Camiones Activos',
      value:      activeVehicles.toString(),
      total:      `de ${totalVehicles} totales`,
      icon:       Truck,
      iconBg:     'bg-primary-50',
      iconColor:  'text-primary-700',
      trendPct:   activeVehicles > 0 ? ((activeVehicles / Math.max(totalVehicles, 1)) * 100) - 100 : 0,
      trendLabel: `${Math.round((activeVehicles / Math.max(totalVehicles, 1)) * 100)}% disponibilidad`,
      invertColors: false,
    },
    {
      label:      'Fletes en Curso',
      value:      tripsInTransit.toString(),
      total:      `${tripsScheduled} programados`,
      icon:       MapPin,
      iconBg:     'bg-info-bg',
      iconColor:  'text-info-text',
      trendPct:   tripsTrend,
      trendLabel: tripsCurr > 0 ? `${tripsCurr} completados este mes` : 'Sin completados este mes',
      invertColors: false,
    },
    {
      label:      'Obras Activas',
      value:      activeProjects.toString(),
      total:      `de ${totalProjects} registradas`,
      icon:       HardHat,
      iconBg:     'bg-warning-bg',
      iconColor:  'text-warning-text',
      trendPct:   activeProjects > 0 ? 0 : -100,
      trendLabel: `${Math.round((activeProjects / Math.max(totalProjects, 1)) * 100)}% en ejecución`,
      invertColors: false,
    },
    {
      label:      'Ingresos del Mes',
      value:      formatCurrency(ingresosEste),
      total:      ingresosAnterior > 0 ? `vs ${formatCurrency(ingresosAnterior)} mes ant.` : 'Sin datos anterior',
      icon:       DollarSign,
      iconBg:     'bg-success-bg',
      iconColor:  'text-success-text',
      trendPct:   ingresosTrend,
      trendLabel: `Facturas cobradas este mes`,
      invertColors: false,
    },
  ]

  // 5. Estado de la Flota
  const vehiclesInMaintenance = safeVehicles.filter(v => v.status === 'in_maintenance').length
  const vehiclesInactive      = safeVehicles.filter(v => v.status === 'inactive').length
  const vehiclesAvailable     = Math.max(0, activeVehicles - tripsInTransit)

  const fleetStatus = [
    { label: 'En Viaje',      count: tripsInTransit,       color: 'bg-primary-light' },
    { label: 'Disponibles',   count: vehiclesAvailable,    color: 'bg-success' },
    { label: 'Mantenimiento', count: vehiclesInMaintenance, color: 'bg-warning' },
    { label: 'Inactivos',     count: vehiclesInactive,     color: 'bg-border-strong' },
  ]
  const totalFleetCalc = fleetStatus.reduce((s, i) => s + i.count, 0)

  // 6. Actividad Reciente
  let activities: any[] = []

  if (recentTrips) {
    activities = [...activities, ...recentTrips.map(t => ({
      id: `trip-${t.id}`,
      type: 'flete',
      text: t.status === 'completed'
        ? `Flete a ${t.destination} completado por ${(t.profiles as any)?.full_name || 'Conductor'}`
        : t.status === 'in_transit'
        ? `Flete en tránsito hacia ${t.destination}`
        : `Nuevo flete programado a ${t.destination}`,
      date: new Date(t.created_at),
      status: t.status === 'completed' ? 'success' : t.status === 'in_transit' ? 'info' : 'warning'
    }))]
  }

  if (recentTx) {
    activities = [...activities, ...recentTx.map(tx => ({
      id: `tx-${tx.id}`,
      type: 'tx',
      text: `${tx.type === 'income' ? 'Ingreso registrado:' : 'Gasto registrado:'} ${tx.description} (${formatCurrency(tx.amount)})`,
      date: new Date(tx.created_at),
      status: tx.type === 'income' ? 'success' : 'warning'
    }))]
  }

  activities.sort((a, b) => b.date.getTime() - a.date.getTime())
  activities = activities.slice(0, 6)

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'Hace minutos'
    if (hours < 24) return `Hace ${hours}h`
    return `Hace ${Math.floor(hours / 24)}d`
  }

  // 7. Chart Data
  const monthlyDataMap = new Map<string, { ingresos: number; gastos: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthName = d.toLocaleDateString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase()
    monthlyDataMap.set(monthName, { ingresos: 0, gastos: 0 })
  }

  allTx?.forEach(tx => {
    const d = new Date(tx.created_at)
    const monthName = d.toLocaleDateString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase()
    if (monthlyDataMap.has(monthName)) {
      const data = monthlyDataMap.get(monthName)!
      if (tx.type === 'income') data.ingresos += tx.amount
      else data.gastos += tx.amount
    }
  })
  const monthlyFinanceData = Array.from(monthlyDataMap.entries()).map(([name, { ingresos, gastos }]) => ({ name, ingresos, gastos }))

  const tripsByProjectMap = new Map<string, number>()
  safeTrips.forEach(trip => {
    // @ts-ignore
    const projName = trip.projects?.name
    if (projName) tripsByProjectMap.set(projName, (tripsByProjectMap.get(projName) || 0) + 1)
  })
  const tripsByProjectData = Array.from(tripsByProjectMap.entries())
    .map(([name, viajes]) => ({ name, viajes }))
    .sort((a, b) => b.viajes - a.viajes)
    .slice(0, 5)

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel General</h1>
          <p className="page-subtitle capitalize">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/fletes" className="btn-primary flex items-center gap-2 text-sm">
            Ir a Fletes
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon    = kpi.icon
          const trend   = trendIcon(kpi.trendPct, kpi.invertColors)
          const TrendIcon = trend.icon
          return (
            <div key={kpi.label} className="kpi-card animate-slide-up">
              <div className={`kpi-icon ${kpi.iconBg}`}>
                <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">
                  {kpi.value}
                  <span className="text-sm font-normal text-text-muted ml-1">{kpi.total}</span>
                </p>
                <p className={`text-xs mt-1 flex items-center gap-1 ${trend.color}`}>
                  <TrendIcon className="w-3 h-3" />
                  {kpi.trendPct !== 0 && Math.abs(kpi.trendPct) >= 1
                    ? `${trend.label} vs mes ant.`
                    : kpi.trendLabel
                  }
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alertas */}
      {hasAlerts && (
        <div className="bg-warning-bg/30 border border-warning/30 rounded-xl p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="text-base font-semibold text-text-primary">Alertas y Avisos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overdueInvoices.length > 0 && (
              <div className="bg-background rounded-lg p-4 border border-warning/20">
                <h4 className="text-sm font-semibold text-danger mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Facturas Vencidas ({overdueInvoices.length})
                </h4>
                <ul className="space-y-2">
                  {overdueInvoices.slice(0, 3).map(inv => (
                    <li key={inv.id} className="text-xs flex justify-between">
                      <span className="truncate pr-2">{inv.invoice_num} - {inv.client_name}</span>
                      <span className="font-medium text-danger flex-shrink-0">{formatCurrency(inv.total)}</span>
                    </li>
                  ))}
                  {overdueInvoices.length > 3 && (
                    <li className="text-xs text-text-muted">+{overdueInvoices.length - 3} más...</li>
                  )}
                </ul>
              </div>
            )}
            
            {lowStockItems.length > 0 && (
              <div className="bg-background rounded-lg p-4 border border-warning/20">
                <h4 className="text-sm font-semibold text-warning-text mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> Stock Bajo ({lowStockItems.length})
                </h4>
                <ul className="space-y-2">
                  {lowStockItems.slice(0, 3).map(item => (
                    <li key={item.id} className="text-xs flex justify-between">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="font-medium text-warning-text flex-shrink-0">{item.quantity} / {item.min_quantity} {item.unit}</span>
                    </li>
                  ))}
                  {lowStockItems.length > 3 && (
                    <li className="text-xs text-text-muted">+{lowStockItems.length - 3} más...</li>
                  )}
                </ul>
              </div>
            )}

            {upcomingMaintenance.length > 0 && (
              <div className="bg-background rounded-lg p-4 border border-warning/20">
                <h4 className="text-sm font-semibold text-info-text mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Mantenimiento Próximo ({upcomingMaintenance.length})
                </h4>
                <ul className="space-y-2">
                  {upcomingMaintenance.slice(0, 3).map(maint => (
                    <li key={maint.id} className="text-xs flex justify-between">
                      <span className="truncate pr-2">{(maint.vehicles as any)?.plate_number}: {maint.description}</span>
                      <span className="font-medium text-info-text flex-shrink-0">
                        {new Date(maint.scheduled_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </li>
                  ))}
                  {upcomingMaintenance.length > 3 && (
                    <li className="text-xs text-text-muted">+{upcomingMaintenance.length - 3} más...</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Fleet Status Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-primary">Estado de Flota</h3>
            <span className="text-xs text-text-muted">{totalVehicles} vehículos totales</span>
          </div>
          <div className="space-y-3">
            {fleetStatus.map((item) => {
              const percentage = totalFleetCalc > 0 ? (item.count / totalFleetCalc) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="font-semibold text-text-primary">{item.count}</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Link href="/dashboard/camiones" className="text-sm text-primary-light font-medium hover:text-primary transition-colors">
              Ver todos los camiones →
            </Link>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card xl:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-primary">Actividad Reciente</h3>
            <Activity className="w-4 h-4 text-text-muted" />
          </div>

          {activities.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Clock className="w-8 h-8 text-text-muted/50 mb-2" />
              <p className="text-sm text-text-secondary">No hay actividad reciente.</p>
            </div>
          ) : (
            <div className="space-y-0 flex-1">
              {activities.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 py-3 ${idx < activities.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {statusIcon[item.status]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary leading-snug">{item.text}</p>
                  </div>
                  <span className="text-xs text-text-muted flex-shrink-0 mt-0.5">
                    {formatTimeAgo(item.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Flujo de Caja Mensual</h3>
              <p className="text-xs text-text-muted mt-0.5">Ingresos vs Gastos operativos (Últimos 6 meses)</p>
            </div>
          </div>
          <MonthlyFinanceChart data={monthlyFinanceData} />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Top 5 Obras Activas</h3>
              <p className="text-xs text-text-muted mt-0.5">Volumen de fletes por destino</p>
            </div>
          </div>
          <TripsByProjectChart data={tripsByProjectData} />
        </div>
      </div>

    </div>
  )
}
