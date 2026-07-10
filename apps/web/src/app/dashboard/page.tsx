import {
  Truck, MapPin, HardHat, DollarSign,
  TrendingUp, TrendingDown, AlertTriangle,
  Clock, CheckCircle2, Circle, Activity
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

const statusIcon: Record<string, React.ReactNode> = {
  info:    <Circle className="w-2 h-2 fill-primary-light text-primary-light" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-warning" />,
  success: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = createClient()

  // 1. Obtener datos reales de Supabase en paralelo
  const [
    { data: vehicles },
    { data: allTrips },
    { data: projects },
    { data: recentTrips },
    { data: recentTx },
    { data: allTx }
  ] = await Promise.all([
    supabase.from('vehicles').select('id, status'),
    supabase.from('trips').select('id, status, projects(name)'),
    supabase.from('projects').select('id, status, budget, currency'),
    supabase.from('trips').select('id, status, destination, created_at, profiles!driver_id(full_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('transactions').select('id, type, amount, description, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('transactions').select('amount, type, created_at').gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString())
  ])

  // 2. Calcular KPIs
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

  const kpis = [
    {
      label: 'Camiones Activos',
      value: activeVehicles.toString(),
      total: `de ${totalVehicles} totales`,
      icon: Truck,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-700',
      trend: 'Disponibilidad alta',
      up: true,
    },
    {
      label: 'Fletes en Curso',
      value: tripsInTransit.toString(),
      total: `${tripsScheduled} programados`,
      icon: MapPin,
      iconBg: 'bg-info-bg',
      iconColor: 'text-info-text',
      trend: 'Operación normal',
      up: true,
    },
    {
      label: 'Obras Activas',
      value: activeProjects.toString(),
      total: `de ${totalProjects} registradas`,
      icon: HardHat,
      iconBg: 'bg-warning-bg',
      iconColor: 'text-warning-text',
      trend: 'En ejecución',
      up: true,
    },
    {
      label: 'Presupuesto Base (USD)',
      value: formatCurrency(budgetUSD),
      total: 'Solo obras en USD',
      icon: DollarSign,
      iconBg: 'bg-success-bg',
      iconColor: 'text-success-text',
      trend: 'Estable',
      up: true,
    },
  ]

  // 3. Estado de la Flota
  const vehiclesInMaintenance = safeVehicles.filter(v => v.status === 'in_maintenance').length
  const vehiclesInactive      = safeVehicles.filter(v => v.status === 'inactive').length
  const vehiclesAvailable     = activeVehicles - tripsInTransit // Simplificación: activos que no están en viaje (puede ser negativo si hay desajuste, lo protegemos)
  
  const fleetStatus = [
    { label: 'En Viaje',      count: tripsInTransit, color: 'bg-primary-light' },
    { label: 'Disponibles',   count: Math.max(0, vehiclesAvailable), color: 'bg-success' },
    { label: 'Mantenimiento', count: vehiclesInMaintenance, color: 'bg-warning' },
    { label: 'Inactivos',     count: vehiclesInactive, color: 'bg-border-strong' },
  ]
  const totalFleetCalc = fleetStatus.reduce((s, i) => s + i.count, 0)

  // 4. Actividad Reciente (Unificar viajes y transacciones)
  let activities: any[] = []
  
  if (recentTrips) {
    activities = [...activities, ...recentTrips.map(t => ({
      id: `trip-${t.id}`,
      type: 'flete',
      text: t.status === 'completed' 
        ? `Flete a ${t.destination} completado por ${t.profiles?.full_name || 'Conductor'}`
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

  // Ordenar por fecha (más reciente primero) y tomar 6
  activities.sort((a, b) => b.date.getTime() - a.date.getTime())
  activities = activities.slice(0, 6)

  // Formatear hora de forma simple
  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'Hace minutos'
    if (hours < 24) return `Hace ${hours}h`
    return `Hace ${Math.floor(hours/24)}d`
  }

  // 5. Compute Chart Data
  // a) Ingresos vs Gastos
  const monthlyDataMap = new Map<string, { ingresos: number, gastos: number }>()
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
  const monthlyFinanceData = Array.from(monthlyDataMap.entries()).map(([name, {ingresos, gastos}]) => ({ name, ingresos, gastos }))

  // b) Viajes por Obra
  const tripsByProjectMap = new Map<string, number>()
  safeTrips.forEach(trip => {
    // @ts-ignore
    const projName = trip.projects?.name
    if (projName) {
      tripsByProjectMap.set(projName, (tripsByProjectMap.get(projName) || 0) + 1)
    }
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
          const Icon = kpi.icon
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
                <p className={`text-xs mt-1 flex items-center gap-1 ${kpi.up ? 'text-success-text' : 'text-warning-text'}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.trend}
                </p>
              </div>
            </div>
          )
        })}
      </div>

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
              // Prevenir división por 0
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
                  className={`flex items-start gap-3 py-3 ${
                    idx < activities.length - 1 ? 'border-b border-border' : ''
                  }`}
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
