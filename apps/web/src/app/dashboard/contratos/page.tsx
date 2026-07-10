import type { Metadata } from 'next'
import { ScrollText, CheckCircle2, AlertCircle, Clock, Building2, Calendar, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewContractButton } from '@/components/contratos/NewContractButton'
import { EditContractButton } from '@/components/contratos/EditContractButton'
import { SearchInput } from '@/components/ui/SearchInput'
import { DeleteContractButton } from '@/components/contratos/DeleteContractButton'

export const metadata: Metadata = { title: 'Contratos | FleetCore' }
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

export default async function ContratosPage({ searchParams }: { searchParams?: { query?: string } }) {
  const supabase = createClient()

  const query = searchParams?.query || ''
  
  let queryBuilder = supabase
    .from('contracts')
    .select(`
      *,
      clients!inner(name)
    `)
    
  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,contract_num.ilike.%${query}%,clients.name.ilike.%${query}%`)
  }
  
  const { data: contracts } = await queryBuilder.order('created_at', { ascending: false })

  // 2. Obtener lista de clientes para el modal
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  const safeContracts = contracts || []
  const safeClients = clients || []

  // KPIs
  const totalActivos = safeContracts.filter(c => c.status === 'active').length
  const totalBorrador = safeContracts.filter(c => c.status === 'draft').length
  const montoActivoUSD = safeContracts
    .filter(c => c.status === 'active' && c.currency === 'USD')
    .reduce((sum, c) => sum + (c.amount || 0), 0)

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Contratos</h1>
          <p className="page-subtitle">Control de licitaciones y acuerdos comerciales con clientes.</p>
        </div>
        <NewContractButton clients={safeClients} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Contratos Activos</p>
            <p className="text-2xl font-bold text-text-primary">{totalActivos}</p>
            <p className="text-xs text-text-muted mt-1">en ejecución</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-warning-bg">
            <Clock className="w-5 h-5 text-warning-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">En Borrador</p>
            <p className="text-2xl font-bold text-text-primary">{totalBorrador}</p>
            <p className="text-xs text-text-muted mt-1">pendientes por firmar</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-primary-50">
            <ScrollText className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total Histórico</p>
            <p className="text-2xl font-bold text-text-primary">{safeContracts.length}</p>
            <p className="text-xs text-text-muted mt-1">todos los registros</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <DollarSign className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Volumen Activo (USD)</p>
            <p className="text-xl font-bold text-text-primary">
              ${new Intl.NumberFormat('en-US').format(montoActivoUSD)}
            </p>
            <p className="text-xs text-text-muted mt-1">suma de contratos activos</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar contrato por título o cliente..." />
        <button className="btn-secondary flex items-center gap-2">
          <ScrollText className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Tabla */}
      {safeContracts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <ScrollText className="w-7 h-7 text-primary-700" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">Sin contratos registrados</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Para registrar un contrato, asegúrate de tener al menos un Cliente activo primero.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="table-header">Contrato</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Vigencia</th>
                <th className="table-header text-right">Monto Global</th>
                <th className="table-header">Estado</th>
                <th className="table-header text-right"></th>
              </tr>
            </thead>
            <tbody>
              {safeContracts.map(contract => (
                <tr key={contract.id} className="table-row">
                  
                  {/* Título y Número */}
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-background-muted flex items-center justify-center flex-shrink-0">
                        <ScrollText className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{contract.title}</p>
                        <p className="text-xs text-text-muted font-mono">{contract.contract_num}</p>
                      </div>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="table-cell">
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-text-muted" />
                      {contract.clients?.name || 'Cliente Eliminado'}
                    </p>
                  </td>

                  {/* Fechas */}
                  <td className="table-cell">
                    {contract.start_date ? (
                      <p className="text-sm text-text-secondary flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(contract.start_date)} <span className="text-text-muted text-xs mx-1">al</span> {formatDate(contract.end_date)}
                      </p>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>

                  {/* Monto */}
                  <td className="table-cell text-right">
                    {contract.amount > 0 ? (
                      <p className="text-sm font-bold text-text-primary">
                        {formatMoney(contract.amount, contract.currency)}
                      </p>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>

                  {/* Estado */}
                  <td className="table-cell">
                    <span className={`badge ${
                      contract.status === 'active' ? 'badge-success' :
                      contract.status === 'draft' ? 'badge-default' :
                      contract.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {contract.status === 'active' ? 'Activo' : 
                       contract.status === 'draft' ? 'Borrador' :
                       contract.status === 'cancelled' ? 'Cancelado' : 'Completado'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditContractButton contract={contract} clients={safeClients} />
                      <DeleteContractButton id={contract.id} title={contract.title} />
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
