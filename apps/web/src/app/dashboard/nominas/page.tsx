import type { Metadata } from 'next'
import { DollarSign, CheckCircle2, Clock, XCircle, Users, User, Briefcase, Calculator, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getBcvRate } from '@/lib/bcv'
import { NewPayrollButton } from '@/components/nominas/NewPayrollButton'
import { EditPayrollButton } from '@/components/nominas/EditPayrollButton'
import { DeletePayrollButton } from '@/components/nominas/DeletePayrollButton'
import { NominasTabs } from '@/components/nominas/NominasTabs'
import { PayrollStatusDropdown } from '@/components/nominas/PayrollStatusDropdown'
import { SearchInput } from '@/components/ui/SearchInput'
import { ExportButton } from '@/components/ui/ExportButton'

export const metadata: Metadata = { title: 'Nóminas y Pagos | FleetCore' }
export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  borrador: { label: 'Borrador', badge: 'badge-default', icon: Clock },
  aprobado: { label: 'Aprobado', badge: 'badge-warning', icon: CheckCircle2 },
  pagado:   { label: 'Pagado',   badge: 'badge-success', icon: CheckCircle2 },
  anulado:  { label: 'Anulado',  badge: 'badge-danger',  icon: XCircle },
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', VES: 'Bs.' }

function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] || currency
  return `${sym} ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(amount)}`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function NominasPage({ searchParams }: { searchParams?: { query?: string, tab?: string } }) {
  const supabase = createClient()

  const query = searchParams?.query || ''
  const tab = searchParams?.tab || 'pendientes'
  
  let queryBuilder = supabase
    .from('payroll_records')
    .select('*, profiles!payroll_records_profile_id_fkey!inner(full_name, role, cedula_identidad, bank_account_number, bank_name)')
    
  if (tab === 'pendientes') {
    queryBuilder = queryBuilder.in('status', ['borrador', 'aprobado'])
  } else if (tab === 'pagadas') {
    queryBuilder = queryBuilder.in('status', ['pagado', 'anulado'])
  }
  
  if (query) {
    queryBuilder = queryBuilder.or(`profiles.full_name.ilike.%${query}%`)
  }
  
  const [
    { data: records, error: fetchError },
    { data: employees },
    bcvRate,
  ] = await Promise.all([
    queryBuilder.order('period_start', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, role, cedula_identidad')
      .in('role', ['driver', 'dispatcher'])
      .order('full_name'),
    getBcvRate()
  ])

  if (fetchError) {
    console.error("Error fetching payroll records:", fetchError)
  }

  const safeRecords   = records || []
  const safeEmployees = employees || []

  // KPIs
  const totalPagados   = safeRecords.filter(r => r.status === 'pagado').length
  const totalPendiente = safeRecords.filter(r => r.status === 'aprobado' || r.status === 'borrador').length
  const totalPersonal  = safeEmployees.length

  const pagosTotalesUSD = safeRecords
    .filter(r => r.status === 'pagado' && r.currency === 'USD')
    .reduce((s, r) => s + (r.net_pay || 0), 0)

  const exportData = safeRecords.map(r => ({
    'ID Recibo': `NOM-${r.id.substring(0,6).toUpperCase()}`,
    'Personal': r.profiles?.full_name || 'Desconocido',
    'Cédula': r.profiles?.cedula_identidad || '',
    'Rol': r.profiles?.role || '',
    'Banco': r.profiles?.bank_name || '',
    'Nro Cuenta': r.profiles?.bank_account_number || '',
    'Desde': r.period_start ? new Date(r.period_start).toLocaleDateString('es-ES') : '',
    'Hasta': r.period_end ? new Date(r.period_end).toLocaleDateString('es-ES') : '',
    'Base': r.base_salary || 0,
    'Bonos': r.bonuses || 0,
    'Deducciones': r.deductions || 0,
    'Pago Neto': r.net_pay || 0,
    'Moneda': r.currency || 'USD',
    'Estado': r.status || 'borrador',
    'Notas': r.notes || ''
  }))

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Nóminas y Pagos</h1>
          <p className="page-subtitle">Gestión de pagos, quincenas, bonos por fletes y deducciones del personal.</p>
        </div>
        <NewPayrollButton employees={safeEmployees} bcvRate={bcvRate} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-primary-50">
            <Users className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Personal Activo</p>
            <p className="text-2xl font-bold text-text-primary">{totalPersonal}</p>
            <p className="text-xs text-text-muted mt-1">choferes y operativos</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-warning-bg">
            <Clock className="w-5 h-5 text-warning-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Pendientes</p>
            <p className="text-2xl font-bold text-text-primary">{totalPendiente}</p>
            <p className="text-xs text-text-muted mt-1">nóminas por pagar</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Pagados</p>
            <p className="text-2xl font-bold text-text-primary">{totalPagados}</p>
            <p className="text-xs text-text-muted mt-1">registros completados</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <DollarSign className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Gasto Total (USD)</p>
            <p className="text-xl font-bold text-text-primary">
              ${new Intl.NumberFormat('en-US').format(pagosTotalesUSD)}
            </p>
            <p className="text-xs text-text-muted mt-1">en nóminas pagadas</p>
          </div>
        </div>
      </div>

      <NominasTabs />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por personal..." />
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename={`Nominas_${new Date().toISOString().split('T')[0]}`} />
        </div>
      </div>

      {/* Tabla */}
      {safeRecords.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <DollarSign className="w-7 h-7 text-primary-700" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">Sin registros de nómina</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Registra el primer pago de quincena o comisión usando el botón "Registrar Pago".
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="table-header">Personal</th>
                <th className="table-header">Período</th>
                <th className="table-header text-right">Sueldo / Base</th>
                <th className="table-header text-right">Bonos</th>
                <th className="table-header text-right">Deducciones</th>
                <th className="table-header text-right">Neto a Pagar</th>
                <th className="table-header">Estado</th>
                <th className="table-header text-right"></th>
              </tr>
            </thead>
            <tbody>
              {safeRecords.map(record => {
                const statusCfg = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.borrador
                const StatusIcon = statusCfg.icon
                const p = record.profiles

                return (
                  <tr key={record.id} className="table-row">

                    {/* Personal */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-background-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {p?.full_name || 'Desconocido'}
                          </p>
                          <p className="text-xs text-text-muted uppercase tracking-wider">
                            {p?.role === 'driver' ? 'Chofer' : p?.role} {p?.cedula_identidad ? `• C.I: ${p.cedula_identidad}` : ''}
                          </p>
                          {p?.bank_account_number && (
                            <p className="text-xs text-text-muted font-mono mt-0.5">
                              {p?.bank_name ? `${p.bank_name} · ` : ''}{p.bank_account_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Período */}
                    <td className="table-cell">
                      <p className="text-sm font-medium text-text-primary">
                        {formatDate(record.period_start)}
                      </p>
                      <p className="text-xs text-text-muted">
                        hasta {formatDate(record.period_end)}
                      </p>
                    </td>

                    {/* Base */}
                    <td className="table-cell text-right">
                      <p className="text-sm text-text-secondary">
                        {formatMoney(record.base_salary, record.currency)}
                      </p>
                    </td>

                    {/* Bonos */}
                    <td className="table-cell text-right">
                      {record.bonuses > 0 ? (
                        <p className="text-sm text-success font-medium">
                          +{formatMoney(record.bonuses, record.currency)}
                        </p>
                      ) : <span className="text-text-muted">—</span>}
                    </td>

                    {/* Deducciones */}
                    <td className="table-cell text-right">
                      {record.deductions > 0 ? (
                        <p className="text-sm text-danger font-medium">
                          -{formatMoney(record.deductions, record.currency)}
                        </p>
                      ) : <span className="text-text-muted">—</span>}
                    </td>

                    {/* Neto */}
                    <td className="table-cell text-right">
                      <p className="text-sm font-bold text-text-primary">
                        {formatMoney(record.net_pay, record.currency)}
                      </p>
                    </td>

                    {/* Estado */}
                    <td className="table-cell">
                      <PayrollStatusDropdown id={record.id} currentStatus={record.status} />
                    </td>

                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/nominas/${record.id}`} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded transition-colors" title="Ver Recibo / Imprimir">
                          <Printer className="w-4 h-4" />
                        </Link>
                        <EditPayrollButton record={record} employees={safeEmployees} />
                        <DeletePayrollButton id={record.id} />
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
