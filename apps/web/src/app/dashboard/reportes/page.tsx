import type { Metadata } from 'next'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MonthlyFinanceChart, TripsByProjectChart } from '@/components/reportes/Charts'
import { format, subMonths, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Reportes y Analítica | FleetCore' }
export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const supabase = createClient()

  // 1. Cargar todos los datos financieros
  const [
    { data: invoices },
    { data: payrolls },
    { data: maintenances },
    { data: fuels },
    { data: trips },
    { data: projects },
  ] = await Promise.all([
    supabase.from('invoices').select('total, currency, status, issued_at').eq('status', 'pagada'),
    supabase.from('payroll_records').select('net_pay, currency, status, payment_date').eq('status', 'pagado'),
    supabase.from('maintenance_records').select('cost, currency, status, completed_date').eq('status', 'completado'),
    supabase.from('fuel_records').select('cost, currency, date'),
    supabase.from('trips').select('id, project_id, status').eq('status', 'completed'),
    supabase.from('projects').select('id, name'),
  ])

  // Helpers para forzar USD (asumiendo todo USD para simplificar analítica en MVP)
  const sumInvoicesUSD = (invoices || []).reduce((acc, curr) => acc + (curr.total || 0), 0)
  const sumPayrollsUSD = (payrolls || []).reduce((acc, curr) => acc + (curr.net_pay || 0), 0)
  const sumMaintUSD    = (maintenances || []).reduce((acc, curr) => acc + (curr.cost || 0), 0)
  const sumFuelUSD     = (fuels || []).reduce((acc, curr) => acc + (curr.cost || 0), 0)

  const totalIngresos = sumInvoicesUSD
  const totalGastos   = sumPayrollsUSD + sumMaintUSD + sumFuelUSD
  const margenNeto    = totalIngresos - totalGastos

  // 2. Preparar Data para Gráfica de Finanzas Mensuales (Real: Últimos 6 meses)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i)
    return {
      name: format(d, 'MMM', { locale: es }), // "ene", "feb", etc.
      ingresos: 0,
      gastos: 0,
      yearMonth: format(d, 'yyyy-MM')
    }
  })

  const assignToMonth = (dateStr: string | null, amount: number, type: 'ingresos' | 'gastos') => {
    if (!dateStr) return
    const d = new Date(dateStr)
    const yyyyMM = format(d, 'yyyy-MM')
    const monthObj = last6Months.find(m => m.yearMonth === yyyyMM)
    if (monthObj) {
      monthObj[type] += amount || 0
    }
  }

  ;(invoices || []).forEach(inv => assignToMonth(inv.issued_at, inv.total, 'ingresos'))
  ;(payrolls || []).forEach(p => assignToMonth(p.payment_date, p.net_pay, 'gastos'))
  ;(maintenances || []).forEach(m => assignToMonth(m.completed_date, m.cost, 'gastos'))
  ;(fuels || []).forEach(f => assignToMonth(f.date, f.cost, 'gastos'))

  const financeData = last6Months.map(m => ({
    name: m.name.charAt(0).toUpperCase() + m.name.slice(1),
    ingresos: m.ingresos,
    gastos: m.gastos
  }))

  // 3. Preparar Data para Gráfica de Viajes por Obra
  const tripsByProject: Record<string, number> = {}
  ;(trips || []).forEach(t => {
    if (t.project_id) {
      tripsByProject[t.project_id] = (tripsByProject[t.project_id] || 0) + 1
    }
  })

  const tripsData = (projects || [])
    .filter(p => tripsByProject[p.id])
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      viajes: tripsByProject[p.id],
    }))
    .sort((a, b) => b.viajes - a.viajes)
    .slice(0, 5) // Top 5 obras

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Analítica</h1>
          <p className="page-subtitle">Rendimiento financiero y operativo de la flota.</p>
        </div>
      </div>

      {/* KPIs Globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className="text-sm font-medium text-text-secondary uppercase tracking-wide">Total Ingresos (USD)</p>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            ${new Intl.NumberFormat('en-US').format(totalIngresos)}
          </p>
          <p className="text-xs text-text-muted mt-1">Facturas cobradas históricas</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-danger-bg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-danger" />
            </div>
            <p className="text-sm font-medium text-text-secondary uppercase tracking-wide">Gastos Operativos</p>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            ${new Intl.NumberFormat('en-US').format(totalGastos)}
          </p>
          <p className="text-xs text-text-muted mt-1">Nómina, Mantenimiento y Combustible</p>
        </div>

        <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium text-primary-900 uppercase tracking-wide">Margen Bruto</p>
          </div>
          <p className="text-3xl font-bold text-primary-700">
            ${new Intl.NumberFormat('en-US').format(margenNeto)}
          </p>
          <p className="text-xs text-primary-600/80 mt-1">Beneficio antes de impuestos</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfica 1 */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Flujo de Caja Mensual
            </h3>
          </div>
          <MonthlyFinanceChart data={financeData} />
        </div>

        {/* Gráfica 2 */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Top Obras por Volumen de Fletes
            </h3>
          </div>
          {tripsData.length > 0 ? (
            <TripsByProjectChart data={tripsData} />
          ) : (
            <div className="h-72 w-full flex flex-col items-center justify-center text-text-muted">
              <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No hay fletes completados aún</p>
            </div>
          )}
        </div>

      </div>

      {/* Distribución de Gastos */}
      <div className="card">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Desglose Histórico de Gastos Operativos</h3>
        <div className="space-y-4">
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Nóminas (Pagadas)</span>
              <span className="font-medium text-text-primary">${new Intl.NumberFormat('en-US').format(sumPayrollsUSD)}</span>
            </div>
            <div className="w-full bg-background-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: totalGastos > 0 ? `${(sumPayrollsUSD / totalGastos) * 100}%` : '0%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Mantenimiento y Taller</span>
              <span className="font-medium text-text-primary">${new Intl.NumberFormat('en-US').format(sumMaintUSD)}</span>
            </div>
            <div className="w-full bg-background-muted rounded-full h-2">
              <div className="bg-warning text-warning-text h-2 rounded-full" style={{ width: totalGastos > 0 ? `${(sumMaintUSD / totalGastos) * 100}%` : '0%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Combustible</span>
              <span className="font-medium text-text-primary">${new Intl.NumberFormat('en-US').format(sumFuelUSD)}</span>
            </div>
            <div className="w-full bg-background-muted rounded-full h-2">
              <div className="bg-danger h-2 rounded-full" style={{ width: totalGastos > 0 ? `${(sumFuelUSD / totalGastos) * 100}%` : '0%' }}></div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
