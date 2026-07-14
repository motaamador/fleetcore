import type { Metadata } from 'next'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Target, TrendingDown as Flat } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MonthlyFinanceChart, TripsByProjectChart } from '@/components/reportes/Charts'
import { ReportExportActions } from '@/components/reportes/ReportExportActions'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

import { DateRangeFilter } from '@/components/reportes/DateRangeFilter'

export const metadata: Metadata = { title: 'Reportes y Analítica | FleetCore' }
export const dynamic = 'force-dynamic'

export default async function ReportesPage({ searchParams }: { searchParams?: { from?: string; to?: string } }) {
  const supabase = createClient()
  
  const fromDate = searchParams?.from || null
  const toDate   = searchParams?.to   || null

  let invQ = supabase.from('invoices').select('total, currency, status, issued_at').eq('status', 'pagada')
  let payQ = supabase.from('payroll_records').select('net_pay, currency, status, payment_date').eq('status', 'pagado')
  let mainQ = supabase.from('maintenance_records').select('cost, currency, status, completed_date').eq('status', 'completado')
  let fuelQ = supabase.from('fuel_records').select('cost, currency, date')
  let tripsQ = supabase.from('trips').select('id, project_id, status').eq('status', 'completed')

  if (fromDate) {
    invQ = invQ.gte('issued_at', fromDate)
    payQ = payQ.gte('payment_date', fromDate)
    mainQ = mainQ.gte('completed_date', fromDate)
    fuelQ = fuelQ.gte('date', fromDate)
    tripsQ = tripsQ.gte('updated_at', fromDate)
  }
  if (toDate) {
    invQ = invQ.lte('issued_at', toDate)
    payQ = payQ.lte('payment_date', toDate)
    mainQ = mainQ.lte('completed_date', toDate)
    fuelQ = fuelQ.lte('date', toDate)
    tripsQ = tripsQ.lte('updated_at', toDate)
  }

  const [
    { data: invoices },
    { data: payrolls },
    { data: maintenances },
    { data: fuels },
    { data: trips },
    { data: projects },
  ] = await Promise.all([
    invQ,
    payQ,
    mainQ,
    fuelQ,
    tripsQ,
    supabase.from('projects').select('id, name'),
  ])

  const sumInvoicesUSD = (invoices    || []).reduce((acc, curr) => acc + (curr.total   || 0), 0)
  const sumPayrollsUSD = (payrolls    || []).reduce((acc, curr) => acc + (curr.net_pay || 0), 0)
  const sumMaintUSD    = (maintenances || []).reduce((acc, curr) => acc + (curr.cost   || 0), 0)
  const sumFuelUSD     = (fuels        || []).reduce((acc, curr) => acc + (curr.cost   || 0), 0)

  const totalIngresos = sumInvoicesUSD
  const totalGastos   = sumPayrollsUSD + sumMaintUSD + sumFuelUSD
  const margenNeto    = totalIngresos - totalGastos
  const margenPct     = totalIngresos > 0 ? ((margenNeto / totalIngresos) * 100) : 0

  // Datos para gráfica mensual (últimos 6 meses)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i)
    return {
      name:      format(d, 'MMM', { locale: es }),
      ingresos:  0,
      gastos:    0,
      yearMonth: format(d, 'yyyy-MM')
    }
  })

  const assignToMonth = (dateStr: string | null, amount: number, type: 'ingresos' | 'gastos') => {
    if (!dateStr) return
    const yyyyMM = dateStr.substring(0, 7) // 'YYYY-MM'
    const monthObj = last6Months.find(m => m.yearMonth === yyyyMM)
    if (monthObj) monthObj[type] += amount || 0
  }

  ;(invoices     || []).forEach(inv => assignToMonth(inv.issued_at,     inv.total,   'ingresos'))
  ;(payrolls     || []).forEach(p   => assignToMonth(p.payment_date,    p.net_pay,   'gastos'))
  ;(maintenances || []).forEach(m   => assignToMonth(m.completed_date,  m.cost,      'gastos'))
  ;(fuels        || []).forEach(f   => assignToMonth(f.date,            f.cost,      'gastos'))

  const financeData = last6Months.map(m => ({
    name:     m.name.charAt(0).toUpperCase() + m.name.slice(1),
    ingresos: m.ingresos,
    gastos:   m.gastos
  }))

  // Viajes por proyecto
  const tripsByProject: Record<string, number> = {}
  ;(trips || []).forEach(t => {
    if (t.project_id) {
      tripsByProject[t.project_id] = (tripsByProject[t.project_id] || 0) + 1
    }
  })

  const tripsData = (projects || [])
    .filter(p => tripsByProject[p.id])
    .map(p => ({
      name:   p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name,
      viajes: tripsByProject[p.id],
    }))
    .sort((a, b) => b.viajes - a.viajes)
    .slice(0, 5)

  const generatedAt = new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })

  // Props para el export client component
  const exportData = {
    financeData,
    totalIngresos,
    totalGastos,
    margenNeto,
    sumPayrollsUSD,
    sumMaintUSD,
    sumFuelUSD,
    reportTitle: 'FleetCore — Reporte Financiero',
    generatedAt,
  }

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Reportes y Analítica</h1>
          <p className="page-subtitle">Rendimiento financiero y operativo de la flota{fromDate || toDate ? ' (Filtrado)' : ''}.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <DateRangeFilter />
          <ReportExportActions data={exportData} />
        </div>
      </div>

      {/* KPIs Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total Ingresos</p>
            <p className="text-xl font-bold text-text-primary mt-0.5">
              ${new Intl.NumberFormat('en-US').format(totalIngresos)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Facturas cobradas</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-danger-bg">
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Gastos Operativos</p>
            <p className="text-xl font-bold text-text-primary mt-0.5">
              ${new Intl.NumberFormat('en-US').format(totalGastos)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Nómina + Mant. + Comb.</p>
          </div>
        </div>

        <div className={`kpi-card ${margenNeto >= 0 ? 'border-success/30 bg-success-bg/20' : 'border-danger/30 bg-danger-bg/20'}`}>
          <div className={`kpi-icon ${margenNeto >= 0 ? 'bg-success-bg' : 'bg-danger-bg'}`}>
            <Target className={`w-5 h-5 ${margenNeto >= 0 ? 'text-success' : 'text-danger'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Margen Neto</p>
            <p className={`text-xl font-bold mt-0.5 ${margenNeto >= 0 ? 'text-success-text' : 'text-danger'}`}>
              ${new Intl.NumberFormat('en-US').format(margenNeto)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {margenPct.toFixed(1)}% del ingreso total
            </p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-info-bg">
            <DollarSign className="w-5 h-5 text-info-text" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Fletes Completados</p>
            <p className="text-xl font-bold text-text-primary mt-0.5">
              {(trips || []).length}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Total histórico</p>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Flujo de Caja Mensual
            </h3>
          </div>
          <MonthlyFinanceChart data={financeData} />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Top Obras por Fletes
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

      {/* Desglose de Gastos */}
      <div className="card print:break-before-page">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Desglose Histórico de Gastos Operativos</h3>
        <div className="space-y-4">
          {[
            { label: 'Nóminas Pagadas',      amount: sumPayrollsUSD, color: 'bg-primary' },
            { label: 'Mantenimiento y Taller', amount: sumMaintUSD,   color: 'bg-warning' },
            { label: 'Combustible',            amount: sumFuelUSD,    color: 'bg-danger' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">{item.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">
                    {totalGastos > 0 ? `${((item.amount / totalGastos) * 100).toFixed(1)}%` : '—'}
                  </span>
                  <span className="font-medium text-text-primary">
                    ${new Intl.NumberFormat('en-US').format(item.amount)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-background-muted rounded-full h-2">
                <div
                  className={`${item.color} h-2 rounded-full transition-all duration-700`}
                  style={{ width: totalGastos > 0 ? `${(item.amount / totalGastos) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}

          {/* Totales */}
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm font-semibold text-text-primary">Total Gastos</span>
            <span className="text-lg font-bold text-text-primary">
              ${new Intl.NumberFormat('en-US').format(totalGastos)}
            </span>
          </div>
        </div>
      </div>

      {/* Pie de página para impresión */}
      <div className="hidden print:block text-xs text-text-muted text-center pt-4 border-t border-border">
        FleetCore ERP · Generado el {generatedAt} · Datos en USD
      </div>

    </div>
  )
}
