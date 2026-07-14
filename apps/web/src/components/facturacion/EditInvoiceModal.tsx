'use client'

import { useState, useTransition } from 'react'
import { X, FileText, Edit2, Loader2, Plus, Trash2, Building2 } from 'lucide-react'
import { updateInvoiceAction } from '@/app/dashboard/facturacion/actions'

interface Project { id: string; name: string }
interface LineItem { id: string; description: string; quantity: string; unit_price: string }
interface InvoiceData {
  id: string; client_name: string; client_rif: string | null; project_id: string | null
  currency: string; tax_pct: number; due_at: string | null; notes: string | null
  status: string
  invoice_items?: { id: string; description: string; quantity: number; unit_price: number }[]
}
interface EditInvoiceModalProps {
  open: boolean; onClose: () => void; invoice: InvoiceData; projects: Project[]
}

const CURRENCIES = ['USD', 'EUR', 'VES']
const SYM: Record<string, string> = { USD: '$', EUR: '€', VES: 'Bs.' }
const fmt = (v: string) => parseFloat(v) || 0

export function EditInvoiceModal({ open, onClose, invoice, projects }: EditInvoiceModalProps) {
  const [form, setForm] = useState({
    client_name: invoice.client_name,
    client_rif:  invoice.client_rif  ?? '',
    project_id:  invoice.project_id  ?? '',
    currency:    invoice.currency,
    tax_pct:     String(invoice.tax_pct),
    due_date:    invoice.due_at      ?? '',
    notes:       invoice.notes       ?? '',
  })
  const [items, setItems] = useState<LineItem[]>(
    invoice.invoice_items?.length
      ? invoice.invoice_items.map(it => ({
          id: it.id, description: it.description,
          quantity: String(it.quantity), unit_price: String(it.unit_price),
        }))
      : [{ id: crypto.randomUUID(), description: '', quantity: '1', unit_price: '' }]
  )
  const [errors, setErrors]  = useState<Record<string, string>>({})
  const [isPending, startTx] = useTransition()

  if (!open) return null

  const isPaid = ['pagada', 'cancelada'].includes(invoice.status)

  const sym      = SYM[form.currency] || form.currency
  const subtotal = items.reduce((s, it) => s + fmt(it.quantity) * fmt(it.unit_price), 0)
  const taxAmt   = subtotal * fmt(form.tax_pct) / 100
  const total    = subtotal + taxAmt

  function set(field: string, val: string) {
    setForm(p => ({ ...p, [field]: val }))
    setErrors(p => ({ ...p, [field]: '' }))
  }
  function setItem(id: string, field: keyof LineItem, val: string) {
    setItems(p => p.map(it => it.id === id ? { ...it, [field]: val } : it))
  }
  function addItem()       { setItems(p => [...p, { id: crypto.randomUUID(), description: '', quantity: '1', unit_price: '' }]) }
  function removeItem(id: string) { if (items.length > 1) setItems(p => p.filter(it => it.id !== id)) }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.client_name.trim()) e.client_name = 'El nombre del cliente es requerido'
    if (items.every(it => !it.description.trim())) e.items = 'Agrega al menos un ítem'
    setErrors(e)
    return !Object.keys(e).length
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    startTx(async () => {
      const result = await updateInvoiceAction(invoice.id, {
        client_name: form.client_name.trim(),
        client_rif:  form.client_rif.trim()  || null,
        project_id:  form.project_id          || null,
        subtotal,
        tax_pct:     fmt(form.tax_pct),
        currency:    form.currency,
        due_at:      form.due_date             || null,
        notes:       form.notes.trim()         || null,
      }, items.map(it => ({ description: it.description.trim(), quantity: fmt(it.quantity), unit_price: fmt(it.unit_price) })))
      if (!result.success && 'error' in result) setErrors({ general: result.error })
      else onClose()
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface border-l border-border shadow-2xl z-50 flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning-bg flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-warning-text" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Editar Factura</h2>
              <p className="text-xs text-text-muted">{invoice.client_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="edit-invoice-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isPaid && (
            <div className="p-3 rounded-lg bg-warning-bg border border-warning/20 text-xs text-warning-text">
              ⚠️ Esta factura está <strong>{invoice.status}</strong>. Solo se pueden editar facturas en borrador o emitidas.
            </div>
          )}
          {errors.general && <div className="p-3 rounded bg-danger-bg text-danger text-sm">{errors.general}</div>}

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Datos del Cliente</h3>
            <div>
              <label className="label"><Building2 className="w-3.5 h-3.5" /> Nombre / Razón Social <span className="text-danger">*</span></label>
              <input type="text" className={`input ${errors.client_name ? 'border-danger' : ''}`} value={form.client_name}
                onChange={e => set('client_name', e.target.value)} disabled={isPaid} />
              {errors.client_name && <p className="text-xs text-danger mt-1">{errors.client_name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">RIF</label>
                <input type="text" className="input" placeholder="J-12345678-9" value={form.client_rif}
                  onChange={e => set('client_rif', e.target.value)} disabled={isPaid} />
              </div>
              <div>
                <label className="label">Obra / Proyecto</label>
                <select className="input" value={form.project_id} onChange={e => set('project_id', e.target.value)} disabled={isPaid}>
                  <option value="">— Sin obra —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Moneda</label>
              <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)} disabled={isPaid}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">IVA (%)</label>
              <input type="number" min="0" max="100" step="0.01" className="input text-center"
                value={form.tax_pct} onChange={e => set('tax_pct', e.target.value)} disabled={isPaid} />
            </div>
            <div>
              <label className="label">Vence</label>
              <input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} disabled={isPaid} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Servicios / Ítems</h3>
              {!isPaid && (
                <button type="button" onClick={addItem} className="text-xs text-primary-light hover:text-primary font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar ítem
                </button>
              )}
            </div>
            {errors.items && <p className="text-xs text-danger mb-2">{errors.items}</p>}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-text-muted px-1 mb-1">
              <span className="col-span-5">Descripción</span>
              <span className="col-span-2 text-center">Cant.</span>
              <span className="col-span-3 text-right">P. Unit.</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="space-y-2">
              {items.map(item => {
                const lineTotal = fmt(item.quantity) * fmt(item.unit_price)
                return (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" className="input col-span-5 text-sm" value={item.description}
                      onChange={e => setItem(item.id, 'description', e.target.value)} disabled={isPaid} />
                    <input type="number" min="1" step="0.01" className="input col-span-2 text-center text-sm"
                      value={item.quantity} onChange={e => setItem(item.id, 'quantity', e.target.value)} disabled={isPaid} />
                    <input type="number" min="0" step="0.01" className="input col-span-3 text-right text-sm"
                      value={item.unit_price} onChange={e => setItem(item.id, 'unit_price', e.target.value)} disabled={isPaid} />
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary flex-1 text-right">
                        {lineTotal > 0 ? `${sym}${new Intl.NumberFormat('es-VE').format(lineTotal)}` : '—'}
                      </span>
                      {!isPaid && (
                        <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1}
                          className="p-1 text-text-muted hover:text-danger transition-colors disabled:opacity-30">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-background border border-border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-medium">{sym}{new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">IVA ({form.tax_pct}%)</span>
              <span className="font-medium">{sym}{new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(taxAmt)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2 mt-2">
              <span>Total {form.currency}</span>
              <span className="text-primary-light">{sym}{new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(total)}</span>
            </div>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea rows={2} className="input resize-none" value={form.notes}
              onChange={e => set('notes', e.target.value)} disabled={isPaid} />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isPending} className="btn-secondary">Cancelar</button>
          <button form="edit-invoice-form" type="submit" disabled={isPending || isPaid}
            className="btn-primary flex items-center gap-2 min-w-[160px] justify-center">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><FileText className="w-4 h-4" /> Guardar Cambios</>}
          </button>
        </div>
      </aside>
    </>
  )
}
