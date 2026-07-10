import os

base_dir = "apps/web/src/components/inventario"
page_dir = "apps/web/src/app/dashboard/inventario"
types_path = "packages/types/src/index.ts"

os.makedirs(base_dir, exist_ok=True)
os.makedirs(page_dir, exist_ok=True)

# 1. Update Types
with open(types_path, "r") as f: types_content = f.read()
if "InventoryItem" not in types_content:
    new_types = """
export interface InventoryItem {
  id: string
  sku: string | null
  name: string
  category: 'repuesto' | 'herramienta' | 'consumible' | 'equipo' | 'otro'
  unit: string
  quantity: number
  min_quantity: number
  unit_cost: number
  currency: string
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
"""
    with open(types_path, "a") as f: f.write(new_types)

# 2. actions.ts
actions_ts = """'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInventoryAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('inventory_items').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventario')
  return { success: true }
}

export async function updateInventoryAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('inventory_items').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventario')
  return { success: true }
}

export async function deleteInventoryAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventario')
  return { success: true }
}
"""
with open(f"{page_dir}/actions.ts", "w") as f: f.write(actions_ts)

# 3. NewInventoryModal.tsx
new_modal = """'use client'

import { useState, useTransition } from 'react'
import { X, Package, Loader2, Tag, Layers, MapPin, DollarSign, FileText } from 'lucide-react'
import { createInventoryAction } from '@/app/dashboard/inventario/actions'

interface NewInventoryModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const INITIAL_FORM = {
  sku: '',
  name: '',
  category: 'repuesto',
  unit: 'unidad',
  quantity: '0',
  min_quantity: '0',
  unit_cost: '0',
  currency: 'USD',
  location: '',
  notes: '',
}

export function NewInventoryModal({ open, onClose, onSuccess }: NewInventoryModalProps) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await createInventoryAction({
          ...form,
          sku: form.sku.trim() || null,
          location: form.location.trim() || null,
          notes: form.notes.trim() || null,
          quantity: parseFloat(form.quantity) || 0,
          min_quantity: parseFloat(form.min_quantity) || 0,
          unit_cost: parseFloat(form.unit_cost) || 0,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ general: `Error: ${err.message}` })
      }
    })
  }

  function handleClose() {
    setForm(INITIAL_FORM)
    setErrors({})
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClose} />
      <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-border shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nuevo Artículo</h2>
              <p className="text-xs text-text-muted">Agregar item al inventario</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="new-item-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {errors.general && (
            <div className="p-3 bg-danger-bg text-danger text-sm rounded-lg border border-danger/20">
              {errors.general}
            </div>
          )}

          <div>
            <label className="label"><Tag className="w-3.5 h-3.5" /> Nombre del Artículo <span className="text-danger">*</span></label>
            <input className={`input ${errors.name ? 'border-danger' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Filtro de Aceite" />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SKU / Código</label>
              <input className="input font-mono text-sm" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="repuesto">Repuesto</option>
                <option value="herramienta">Herramienta</option>
                <option value="consumible">Consumible</option>
                <option value="equipo">Equipo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Cantidad</label>
              <input type="number" step="0.01" className="input" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div>
              <label className="label">Mínimo</label>
              <input type="number" step="0.01" className="input" value={form.min_quantity} onChange={e => set('min_quantity', e.target.value)} />
            </div>
            <div>
              <label className="label">Unidad</label>
              <input className="input" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="unidad, L, kg..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label"><DollarSign className="w-3.5 h-3.5" /> Costo Unitario</label>
              <input type="number" step="0.01" className="input" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="VES">VES (Bs)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label"><MapPin className="w-3.5 h-3.5" /> Ubicación</label>
            <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ej: Estante A2, Almacén Principal" />
          </div>

          <div>
            <label className="label"><FileText className="w-3.5 h-3.5" /> Notas Adicionales</label>
            <textarea rows={2} className="input resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">Cancelar</button>
          <button form="new-item-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[120px] justify-center">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar'}
          </button>
        </div>
      </aside>
    </>
  )
}
"""
with open(f"{base_dir}/NewInventoryModal.tsx", "w") as f: f.write(new_modal)

# 4. EditInventoryModal.tsx
edit_modal = new_modal.replace("NewInventoryModalProps", "EditInventoryModalProps")
edit_modal = edit_modal.replace("createInventoryAction", "updateInventoryAction")
edit_modal = edit_modal.replace("Nuevo Artículo", "Editar Artículo")
edit_modal = edit_modal.replace("Agregar item al inventario", "Actualizar datos")
edit_modal = edit_modal.replace("new-item-form", "edit-item-form")
edit_modal = edit_modal.replace("export function NewInventoryModal({ open, onClose, onSuccess }: EditInventoryModalProps) {", "export function EditInventoryModal({ open, onClose, onSuccess, record }: EditInventoryModalProps) {")
edit_modal = edit_modal.replace("interface EditInventoryModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n}", "interface EditInventoryModalProps {\n  open: boolean\n  onClose: () => void\n  onSuccess: () => void\n  record: any\n}")
edit_modal = edit_modal.replace("import { useState, useTransition } from 'react'", "import { useEffect, useState, useTransition } from 'react'")

use_effect = """
  useEffect(() => {
    if (open && record) {
      setForm({
        sku: record.sku || '',
        name: record.name || '',
        category: record.category || 'repuesto',
        unit: record.unit || 'unidad',
        quantity: String(record.quantity || 0),
        min_quantity: String(record.min_quantity || 0),
        unit_cost: String(record.unit_cost || 0),
        currency: record.currency || 'USD',
        location: record.location || '',
        notes: record.notes || '',
      })
    }
  }, [open, record])
"""
edit_modal = edit_modal.replace("const [isPending, startTransition] = useTransition()\n", "const [isPending, startTransition] = useTransition()\n" + use_effect)
edit_modal = edit_modal.replace("await updateInventoryAction({", "await updateInventoryAction(record.id, {")
with open(f"{base_dir}/EditInventoryModal.tsx", "w") as f: f.write(edit_modal)


# 5. Buttons
with open(f"{base_dir}/NewInventoryButton.tsx", "w") as f: f.write("""'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { NewInventoryModal } from './NewInventoryModal'

export function NewInventoryButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus className="w-4 h-4" /> Nuevo Artículo
      </button>
      <NewInventoryModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} />
    </>
  )
}
""")

with open(f"{base_dir}/EditInventoryButton.tsx", "w") as f: f.write("""'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { EditInventoryModal } from './EditInventoryModal'

export function EditInventoryButton({ record }: { record: any }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const handleSuccess = useCallback(() => router.refresh(), [router])

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true) }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors" title="Editar">
        <Pencil className="w-4 h-4" />
      </button>
      <EditInventoryModal open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} record={record} />
    </>
  )
}
""")

with open(f"{base_dir}/DeleteInventoryButton.tsx", "w") as f: f.write("""'use client'
import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteInventoryAction } from '@/app/dashboard/inventario/actions'

export function DeleteInventoryButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de eliminar este artículo?`)) return
    startTransition(async () => {
      try { await deleteInventoryAction(id) }
      catch (err: any) { alert(`Error al eliminar: ${err.message}`) }
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors disabled:opacity-50" title="Eliminar">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
""")

# 6. page.tsx
with open(f"{page_dir}/page.tsx", "w") as f: f.write("""import type { Metadata } from 'next'
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
""")

print("Inventario Built!")
