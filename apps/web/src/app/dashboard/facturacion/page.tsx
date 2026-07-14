import type { Metadata } from 'next'
import { FileText, CheckCircle2, Clock, XCircle, DollarSign, AlertCircle, Building2, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NewInvoiceButton } from '@/components/facturacion/NewInvoiceButton'
import { DeleteInvoiceButton } from '@/components/facturacion/DeleteInvoiceButton'
import { EditInvoiceButton } from '@/components/facturacion/EditInvoiceButton'
import { FacturacionTabs } from '@/components/facturacion/FacturacionTabs'
import { InvoiceStatusDropdown } from '@/components/facturacion/InvoiceStatusDropdown'
import { SearchInput } from '@/components/ui/SearchInput'
import { ExportButton } from '@/components/ui/ExportButton'

export const metadata: Metadata = { title: 'Facturación | FleetCore' }
export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  borrador:  { label: 'Borrador',  badge: 'badge-default', icon: Clock },
  emitida:   { label: 'Emitida',   badge: 'bg-info-bg text-info-text', icon: FileText },
  pagada:    { label: 'Pagada',    badge: 'badge-success', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada', badge: 'badge-danger',  icon: XCircle },
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', VES: 'Bs.' }

function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] || currency
  return `${sym} ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(amount)}`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function FacturacionPage({ searchParams }: { searchParams?: { query?: string, tab?: string } }) {
  const supabase = createClient()

  const query = searchParams?.query || ''
  const tab = searchParams?.tab || 'pendientes'
  
  let q = supabase
    .from('invoices')
    .select('*, projects(name), invoice_items(id, description, quantity, unit_price)')
    
  if (tab === 'pendientes') {
    q = q.in('status', ['borrador', 'emitida'])
  } else if (tab === 'pagadas') {
    q = q.in('status', ['pagada', 'cancelada'])
  }
  
  if (query) {
    q = q.or(`client_name.ilike.%${query}%,invoice_num.ilike.%${query}%`)
  }

  const [
    { data: invoices },
    { data: projects },
  ] = await Promise.all([
    q.order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name')
      .order('name'),
  ])

  const safeInvoices = invoices || []
  const safeProjects = projects || []

  // KPIs
  const totalEmitidas = safeInvoices.filter(i => i.status === 'emitida').length
  const totalPagadas  = safeInvoices.filter(i => i.status === 'pagada').length
  const totalBorradores = safeInvoices.filter(i => i.status === 'borrador').length

  const ingresosTotalesUSD = safeInvoices
    .filter(i => i.status === 'pagada' && i.currency === 'USD')
    .reduce((s, i) => s + (i.total || 0), 0)

  const pendienteUSD = safeInvoices
    .filter(i => i.status === 'emitida' && i.currency === 'USD')
    .reduce((s, i) => s + (i.total || 0), 0)

  // Formatear data para CSV
  const exportData = safeInvoices.map(i => ({
    'N° Factura': i.invoice_num,
    'Cliente': i.client_name,
    'RIF/ID': i.client_rif || '',
    'Obra': i.projects?.name || '',
    'Fecha Emisión': i.issued_at ? new Date(i.issued_at).toLocaleDateString('es-ES') : '',
    'Fecha Vencimiento': i.due_at ? new Date(i.due_at).toLocaleDateString('es-ES') : '',
    'Moneda': i.currency,
    'Subtotal': i.subtotal || 0,
    'IVA (%)': i.tax_pct || 0,
    'IVA (Monto)': i.tax_amount || 0,
    'Total': i.total || 0,
    'Estado': i.status
  }))

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturación</h1>
          <p className="page-subtitle">Gestión de facturas, cobros y estado de cuenta de clientes.</p>
        </div>
        <NewInvoiceButton projects={safeProjects} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-info-bg">
            <FileText className="w-5 h-5 text-info-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Emitidas</p>
            <p className="text-2xl font-bold text-text-primary">{totalEmitidas}</p>
            <p className="text-xs text-text-muted mt-1">{totalBorradores} borradores</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Cobradas</p>
            <p className="text-2xl font-bold text-text-primary">{totalPagadas}</p>
            <p className="text-xs text-text-muted mt-1">facturas pagadas</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <DollarSign className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Ingresos (USD)</p>
            <p className="text-xl font-bold text-text-primary">
              ${new Intl.NumberFormat('en-US').format(ingresosTotalesUSD)}
            </p>
            <p className="text-xs text-text-muted mt-1">facturas cobradas</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-warning-bg">
            <AlertCircle className="w-5 h-5 text-warning-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Por Cobrar (USD)</p>
            <p className="text-xl font-bold text-text-primary">
              ${new Intl.NumberFormat('en-US').format(pendienteUSD)}
            </p>
            <p className="text-xs text-text-muted mt-1">facturas emitidas</p>
          </div>
        </div>
      </div>

      <FacturacionTabs />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por cliente o N° factura..." />
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename={`Facturas_${new Date().toISOString().split('T')[0]}`} />
        </div>
      </div>

      {/* Tabla */}
      {safeInvoices.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-success-bg flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-success-text" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">Sin facturas registradas</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Crea tu primera factura con el botón "Nueva Factura".
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="table-header">N° Factura</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Obra</th>
                <th className="table-header">Fecha</th>
                <th className="table-header text-right">Subtotal</th>
                <th className="table-header text-right">IVA</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header">Estado</th>
                <th className="table-header text-right"></th>
              </tr>
            </thead>
            <tbody>
              {safeInvoices.map(invoice => {
                const statusCfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.borrador
                const StatusIcon = statusCfg.icon

                return (
                  <tr key={invoice.id} className="table-row">

                    {/* N° Factura */}
                    <td className="table-cell">
                      <span className="text-sm font-mono font-semibold text-primary-light">
                        {invoice.invoice_num}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{invoice.client_name}</p>
                          {invoice.client_rif && (
                            <p className="text-xs text-text-muted">{invoice.client_rif}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Obra */}
                    <td className="table-cell">
                      <p className="text-sm text-text-secondary">
                        {invoice.projects?.name || '—'}
                      </p>
                    </td>

                    {/* Fecha */}
                    <td className="table-cell">
                      <p className="text-sm text-text-primary">{formatDate(invoice.issued_at)}</p>
                      {invoice.due_at && (
                        <p className="text-xs text-text-muted">Vence: {formatDate(invoice.due_at)}</p>
                      )}
                    </td>

                    {/* Subtotal */}
                    <td className="table-cell text-right">
                      <p className="text-sm text-text-secondary">{formatMoney(invoice.subtotal, invoice.currency)}</p>
                    </td>

                    {/* IVA */}
                    <td className="table-cell text-right">
                      <p className="text-sm text-text-secondary">
                        {formatMoney(invoice.tax_amount || 0, invoice.currency)}
                        <span className="text-xs text-text-muted ml-1">({invoice.tax_pct}%)</span>
                      </p>
                    </td>

                    {/* Total */}
                    <td className="table-cell text-right">
                      <p className="text-sm font-bold text-text-primary">{formatMoney(invoice.total, invoice.currency)}</p>
                    </td>

                    {/* Estado */}
                    <td className="table-cell">
                      <InvoiceStatusDropdown id={invoice.id} currentStatus={invoice.status} />
                    </td>

                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EditInvoiceButton
                          invoice={{
                            id: invoice.id,
                            client_name: invoice.client_name,
                            client_rif:  invoice.client_rif,
                            project_id:  invoice.project_id,
                            currency:    invoice.currency,
                            tax_pct:     invoice.tax_pct,
                            due_at:      invoice.due_at,
                            notes:       invoice.notes,
                            status:      invoice.status,
                            invoice_items: invoice.invoice_items,
                          }}
                          projects={safeProjects}
                        />
                        <Link href={`/dashboard/facturacion/${invoice.id}`} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded transition-colors" title="Ver / Imprimir">
                          <Printer className="w-4 h-4" />
                        </Link>
                        <DeleteInvoiceButton id={invoice.id} />
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
