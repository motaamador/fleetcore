import type { Metadata } from 'next'
import { Building2, Mail, Phone, MapPin, CheckCircle2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewClientButton } from '@/components/clientes/NewClientButton'
import { EditClientButton } from '@/components/clientes/EditClientButton'
import { DeleteClientButton } from '@/components/clientes/DeleteClientButton'
import { SearchInput } from '@/components/ui/SearchInput'

export const metadata: Metadata = { title: 'Clientes y Empresas | FleetCore' }
export const dynamic = 'force-dynamic'

export default async function ClientesPage({ searchParams }: { searchParams?: { query?: string } }) {
  const supabase = createClient()

  // Obtener clientes
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  const safeClients = clients || []

  // KPIs
  const totalActivos = safeClients.filter(c => c.status === 'active').length
  const totalInactivos = safeClients.filter(c => c.status === 'inactive').length

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Directorio de Clientes</h1>
          <p className="page-subtitle">Gestión centralizada de empresas, contratistas y clientes directos.</p>
        </div>
        <NewClientButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-primary-50">
            <Users className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total Clientes</p>
            <p className="text-2xl font-bold text-text-primary">{safeClients.length}</p>
            <p className="text-xs text-text-muted mt-1">registrados en base de datos</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Clientes Activos</p>
            <p className="text-2xl font-bold text-text-primary">{totalActivos}</p>
            <p className="text-xs text-text-muted mt-1">operando actualmente</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar cliente por nombre o RIF..." />
        <button className="btn-secondary flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Tabla */}
      {safeClients.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-primary-700" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">No hay clientes registrados</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Comienza a armar tu cartera de clientes para enlazarlos a obras y facturas.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="table-header">Razón Social / Nombre</th>
                <th className="table-header">RIF / ID</th>
                <th className="table-header">Contacto</th>
                <th className="table-header">Dirección</th>
                <th className="table-header">Estado</th>
                <th className="table-header text-right"></th>
              </tr>
            </thead>
            <tbody>
              {safeClients.map(client => (
                <tr key={client.id} className="table-row">
                  
                  {/* Nombre */}
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-background-muted flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {client.name}
                        </p>
                        {client.contact_person && (
                          <p className="text-xs text-text-muted">
                            Atte: {client.contact_person}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* RIF */}
                  <td className="table-cell">
                    <p className="text-sm text-text-primary font-mono">{client.rif}</p>
                  </td>

                  {/* Contacto */}
                  <td className="table-cell">
                    <div className="space-y-1">
                      {client.phone ? (
                        <p className="text-xs text-text-secondary flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </p>
                      ) : <span className="text-xs text-text-muted">—</span>}
                      {client.email ? (
                        <p className="text-xs text-text-secondary flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> {client.email}
                        </p>
                      ) : null}
                    </div>
                  </td>

                  {/* Dirección */}
                  <td className="table-cell">
                    {client.address ? (
                      <p className="text-xs text-text-secondary flex items-start gap-1 max-w-[200px] truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" /> 
                        <span className="truncate" title={client.address}>{client.address}</span>
                      </p>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>

                  {/* Estado */}
                  <td className="table-cell">
                    <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-default'}`}>
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditClientButton client={client} />
                      <DeleteClientButton id={client.id} name={client.name} />
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
