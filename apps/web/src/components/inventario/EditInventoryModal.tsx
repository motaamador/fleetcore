'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, Package, Loader2, Tag, Layers, MapPin, DollarSign, FileText } from 'lucide-react'
import { updateInventoryAction } from '@/app/dashboard/inventario/actions'

interface EditInventoryModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  record: any
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

export function EditInventoryModal({ open, onClose, onSuccess, record }: EditInventoryModalProps) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

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
        await updateInventoryAction(record.id, {
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
              <h2 className="text-base font-semibold text-text-primary">Editar Artículo</h2>
              <p className="text-xs text-text-muted">Actualizar datos</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="edit-item-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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
          <button form="edit-item-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[120px] justify-center">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar'}
          </button>
        </div>
      </aside>
    </>
  )
}
