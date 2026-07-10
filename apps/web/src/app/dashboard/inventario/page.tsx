import type { Metadata } from 'next'
import { Package, AlertTriangle, Boxes, BoxSelect, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewInventoryButton } from '@/components/inventario/NewInventoryButton'
import { EditInventoryButton } from '@/components/inventario/EditInventoryButton'
import { DeleteInventoryButton } from '@/components/inventario/DeleteInventoryButton'
import { SearchInput } from '@/components/ui/SearchInput'
import type { InventoryItem } from '@fleetcore/types'

export const metadata: Metadata = { title: 'Inventario | FleetCore' }
export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  repuesto: 'Repuesto',
  herramienta: 'Herramienta',
  consumible: 'Consumible',
  equipo: 'Equipo',
  otro: 'Otro',
}

export default async function InventarioPage({ searchParams }: { searchParams?: { query?: string } }) {
  const supabase = createClient()
  const query = searchParams?.query || ''
  
  let q = supabase.from('inventory_items').select('*')
  if (query) {
    q = q.or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
  }
  
  const { data: items, error } = await q.order('name')
  const inventory: InventoryItem[] = items || []

  // KPIs
  const totalItems = inventory.length
  const lowStock = inventory.filter(i => i.quantity <= i.min_quantity).length
  const totalValueUSD = inventory
    .filter(i => i.currency === 'USD')
    .reduce((acc, curr) => acc + (curr.quantity * curr.unit_cost), 0)
  
  const formatter = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 })

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario y Almacén</h1>
          <p className="page-subtitle">Control de existencias de repuestos, herramientas y consumibles.</p>
        </div>
        <NewInventoryButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-primary-50">
            <Boxes className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Artículos Únicos</p>
            <p className="text-2xl font-bold text-text-primary">{totalItems}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-warning-bg">
            <AlertTriangle className="w-5 h-5 text-warning-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Bajo Stock</p>
            <p className="text-2xl font-bold text-text-primary">{lowStock}</p>
            <p className="text-xs text-text-muted mt-1">por debajo del mínimo</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <DollarSign className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Valorizado (USD)</p>
            <p className="text-xl font-bold text-text-primary">
              ${new Intl.NumberFormat('en-US').format(totalValueUSD)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput placeholder="Buscar por nombre o SKU..." />
      </div>

      <div className="table-wrapper">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr>
              <th className="table-header">Artículo</th>
              <th className="table-header">Categoría</th>
              <th className="table-header text-right">Existencia</th>
              <th className="table-header text-right">Costo Unit.</th>
              <th className="table-header">Ubicación</th>
              <th className="table-header text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const isLow = item.quantity <= item.min_quantity
              return (
                <tr key={item.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isLow ? 'bg-danger-bg' : 'bg-background-muted'}`}>
                        {isLow ? <AlertTriangle className="w-4 h-4 text-danger" /> : <BoxSelect className="w-4 h-4 text-text-secondary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                        {item.sku && <p className="text-xs font-mono text-text-muted">SKU: {item.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-sm text-text-secondary">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </td>
                  <td className="table-cell text-right">
                    <p className={`text-sm font-bold ${isLow ? 'text-danger' : 'text-text-primary'}`}>
                      {item.quantity} {item.unit}
                    </p>
                    <p className="text-xs text-text-muted">Min: {item.min_quantity}</p>
                  </td>
                  <td className="table-cell text-right text-sm text-text-secondary">
                    {item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : 'Bs.'} {formatter.format(item.unit_cost)}
                  </td>
                  <td className="table-cell text-sm text-text-muted">
                    {item.location || '—'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditInventoryButton record={item} />
                      <DeleteInventoryButton id={item.id} />
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
