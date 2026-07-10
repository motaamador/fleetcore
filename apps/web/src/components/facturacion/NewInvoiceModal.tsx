'use client'

import { useState, useTransition } from 'react'
import { X, FileText, Loader2, Plus, Trash2, Building2 } from 'lucide-react'
import { createInvoiceAction } from '@/app/dashboard/facturacion/actions'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Project { id: string; name: string }

interface LineItem {
  id: string
  description: string
  quantity: string
  unit_price: string
}

interface NewInvoiceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  projects: Project[]
}

interface FormData {
  client_name: string
  client_rif:  string
  project_id:  string
  currency:    string
  tax_pct:     string
  due_date:    string
  notes:       string
}

const INITIAL_FORM: FormData = {
  client_name: '',
  client_rif:  '',
  project_id:  '',
  currency:    'USD',
  tax_pct:     '16',
  due_date:    '',
  notes:       '',
}

const newLineItem = (): LineItem => ({
  id:          crypto.randomUUID(),
  description: '',
  quantity:    '1',
  unit_price:  '',
})

const CURRENCIES = ['USD', 'EUR', 'VES']
const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', VES: 'Bs.' }

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatNum(val: string): number { return parseFloat(val) || 0 }

// ── Componente ─────────────────────────────────────────────────────────────────
export function NewInvoiceModal({ open, onClose, onSuccess, projects }: NewInvoiceModalProps) {
  const [form,  setForm]  = useState<FormData>(INITIAL_FORM)
  const [items, setItems] = useState<LineItem[]>([newLineItem()])
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function setItem(id: string, field: keyof LineItem, value: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it))
  }

  function addItem() { setItems(prev => [...prev, newLineItem()]) }
  function removeItem(id: string) {
    if (items.length === 1) return
    setItems(prev => prev.filter(it => it.id !== id))
  }

  // Cálculos en tiempo real
  const sym      = CURRENCY_SYMBOLS[form.currency] || form.currency
  const subtotal = items.reduce((s, it) => s + formatNum(it.quantity) * formatNum(it.unit_price), 0)
  const taxPct   = formatNum(form.tax_pct)
  const taxAmt   = subtotal * taxPct / 100
  const total    = subtotal + taxAmt

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.client_name.trim()) e.client_name = 'El nombre del cliente es requerido'
    if (items.every(it => !it.description.trim())) e.items = 'Agrega al menos un ítem con descripción'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await createInvoiceAction({
          invoice_num: '',
          client_name: form.client_name.trim(),
          client_rif:  form.client_rif.trim()  || null,
          project_id:  form.project_id          || null,
          subtotal,
          tax_pct:     taxPct,
          currency:    form.currency,
          status:      'borrador',
          due_at:      form.due_date             || null,
          notes:       form.notes.trim()         || null,
        }, items.map(it => ({
            description: it.description.trim(),
            quantity: formatNum(it.quantity),
            unit_price: formatNum(it.unit_price),
        })))
        setForm(INITIAL_FORM)
        setItems([newLineItem()])
        onSuccess()
        handleClose()
      } catch (err: any) {
        setErrors({ client_name: `Error: ${err.message}` })
      }
    })
  }

  function handleClose() {
    setForm(INITIAL_FORM)
    setItems([newLineItem()])
    setErrors({})
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClose} />

      <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface border-l border-border shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-success-text" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nueva Factura</h2>
              <p className="text-xs text-text-muted">El número se genera automáticamente</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form id="nueva-factura-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Datos del Cliente */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Datos del Cliente</h3>
            <div>
              <label className="label">
                <Building2 className="w-3.5 h-3.5" /> Nombre / Razón Social <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`input ${errors.client_name ? 'border-danger' : ''}`}
                placeholder="Ej: Constructora Horizonte C.A."
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
              />
              {errors.client_name && <p className="text-xs text-danger mt-1">{errors.client_name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">RIF</label>
                <input
                  type="text"
                  className="input"
                  placeholder="J-12345678-9"
                  value={form.client_rif}
                  onChange={e => set('client_rif', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Obra / Proyecto</label>
                <select className="input" value={form.project_id} onChange={e => set('project_id', e.target.value)}>
                  <option value="">— Sin obra —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Moneda</label>
              <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">IVA (%)</label>
              <input
                type="number" min="0" max="100" step="0.01"
                className="input text-center"
                value={form.tax_pct}
                onChange={e => set('tax_pct', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Vence</label>
              <input
                type="date"
                className="input"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
              />
            </div>
          </div>

          {/* Ítems / Líneas de Servicio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Servicios / Ítems</h3>
              <button type="button" onClick={addItem} className="text-xs text-primary-light hover:text-primary font-medium flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Agregar ítem
              </button>
            </div>
            {errors.items && <p className="text-xs text-danger mb-2">{errors.items}</p>}

            {/* Cabecera */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-text-muted px-1 mb-1">
              <span className="col-span-5">Descripción</span>
              <span className="col-span-2 text-center">Cant.</span>
              <span className="col-span-3 text-right">Precio Unit.</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const lineTotal = formatNum(item.quantity) * formatNum(item.unit_price)
                return (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      className="input col-span-5 text-sm"
                      placeholder={`Servicio ${idx + 1}`}
                      value={item.description}
                      onChange={e => setItem(item.id, 'description', e.target.value)}
                    />
                    <input
                      type="number" min="1" step="0.01"
                      className="input col-span-2 text-center text-sm"
                      value={item.quantity}
                      onChange={e => setItem(item.id, 'quantity', e.target.value)}
                    />
                    <input
                      type="number" min="0" step="0.01"
                      className="input col-span-3 text-right text-sm"
                      placeholder="0.00"
                      value={item.unit_price}
                      onChange={e => setItem(item.id, 'unit_price', e.target.value)}
                    />
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary text-right flex-1">
                        {lineTotal > 0 ? `${sym}${new Intl.NumberFormat('es-VE').format(lineTotal)}` : '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="p-1 text-text-muted hover:text-danger transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-background border border-border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-medium text-text-primary">{sym}{new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">IVA ({taxPct}%)</span>
              <span className="font-medium text-text-primary">{sym}{new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(taxAmt)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2 mt-2">
              <span className="text-text-primary">Total {form.currency}</span>
              <span className="text-primary-light">{sym}{new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(total)}</span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="label">Notas / Condiciones de Pago</label>
            <textarea
              rows={2}
              className="input resize-none"
              placeholder="Ej: Pago a 30 días. Transferencia bancaria."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
            Cancelar
          </button>
          <button form="nueva-factura-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[160px] justify-center">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><FileText className="w-4 h-4" /> Emitir Factura</>
            }
          </button>
        </div>

      </aside>
    </>
  )
}
