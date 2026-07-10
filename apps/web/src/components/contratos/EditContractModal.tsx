'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, ScrollText, Loader2, Building2, Calendar, DollarSign, FileText } from 'lucide-react'
import { updateContractAction } from '@/app/dashboard/contratos/actions'

interface Client { id: string; name: string }

interface EditContractModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  clients: Client[]
  contract: any
}

interface FormData {
  contract_num: string
  client_id: string
  title: string
  description: string
  start_date: string
  end_date: string
  start_date_display: string
  end_date_display: string
  amount: string
  currency: string
  status: string
}

const INITIAL_FORM: FormData = {
  contract_num: '', client_id: '', title: '', description: '',
  start_date: '', end_date: '', amount: '', currency: 'USD', status: 'draft',
  start_date_display: '', end_date_display: ''
}

// Helpers para fecha
function parseDisplayDate(display: string) {
  const v = display.replace(/[^0-9]/g, '').slice(0, 8)
  return v.length <= 2 ? v : v.length <= 4 ? `${v.slice(0,2)}/${v.slice(2)}` : `${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4)}`
}
function displayToISO(display: string) {
  if (display.length !== 10) return null
  const [d, m, y] = display.split('/')
  return `${y}-${m}-${d}`
}
function isoToDisplay(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const CURRENCIES = ['USD', 'EUR', 'VES']
const STATUS_OPTIONS = [
  { value: 'draft',     label: 'Borrador' },
  { value: 'active',    label: 'Activo' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export function EditContractModal({ open, onClose, onSuccess, clients, contract }: EditContractModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && contract) {
      setForm({
        contract_num: contract.contract_num || '',
        client_id: contract.client_id || '',
        title: contract.title || '',
        description: contract.description || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        start_date_display: isoToDisplay(contract.start_date),
        end_date_display: isoToDisplay(contract.end_date),
        amount: contract.amount ? String(contract.amount) : '',
        currency: contract.currency || 'USD',
        status: contract.status || 'draft'
      })
    }
  }, [open, contract])

  if (!open) return null

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const e: Partial<FormData> = {}
    if (!form.contract_num.trim()) e.contract_num = 'El número es requerido'
    if (!form.client_id) e.client_id = 'Selecciona un cliente'
    if (!form.title.trim()) e.title = 'El título es requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await updateContractAction(contract.id, {
          contract_num: form.contract_num.trim(),
          client_id:    form.client_id,
          title:        form.title.trim(),
          description:  form.description.trim() || null,
          start_date:   displayToISO(form.start_date_display),
          end_date:     displayToISO(form.end_date_display),
          amount:       form.amount ? parseFloat(form.amount) : 0,
          currency:     form.currency,
          status:       form.status,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ title: `Error: ${err.message}` })
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

      <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Editar Contrato</h2>
              <p className="text-xs text-text-muted">Registra un acuerdo comercial o licitación</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="editar-contrato-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Título del Contrato <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`input ${errors.title ? 'border-danger' : ''}`}
                placeholder="Ej: Contrato de Transporte 2026"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
              {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="label"><FileText className="w-3.5 h-3.5" /> N° Contrato <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`input ${errors.contract_num ? 'border-danger' : ''}`}
                placeholder="Ej: CT-2026-001"
                value={form.contract_num}
                onChange={e => set('contract_num', e.target.value)}
              />
              {errors.contract_num && <p className="text-xs text-danger mt-1">{errors.contract_num}</p>}
            </div>

            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label"><Building2 className="w-3.5 h-3.5" /> Cliente Vinculado <span className="text-danger">*</span></label>
            <select
              className={`input ${errors.client_id ? 'border-danger' : ''}`}
              value={form.client_id}
              onChange={e => set('client_id', e.target.value)}
            >
              <option value="">— Seleccionar cliente —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.client_id && <p className="text-xs text-danger mt-1">{errors.client_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label"><Calendar className="w-3.5 h-3.5" /> Fecha Inicio</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  className="input pr-8"
                  value={form.start_date_display}
                  onChange={(e) => set('start_date_display', parseDisplayDate(e.target.value))}
                />
                <input
                  type="date"
                  className="absolute inset-y-0 right-0 w-8 opacity-0 cursor-pointer z-10"
                  onChange={(e) => set('start_date_display', isoToDisplay(e.target.value))}
                />
                <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label"><Calendar className="w-3.5 h-3.5" /> Fecha Fin</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  className="input pr-8"
                  value={form.end_date_display}
                  onChange={(e) => set('end_date_display', parseDisplayDate(e.target.value))}
                />
                <input
                  type="date"
                  className="absolute inset-y-0 right-0 w-8 opacity-0 cursor-pointer z-10"
                  onChange={(e) => set('end_date_display', isoToDisplay(e.target.value))}
                />
                <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label"><DollarSign className="w-3.5 h-3.5" /> Monto Global</label>
              <input
                type="number" step="0.01" min="0"
                className="input"
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Descripción / Alcance</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Detalles breves del contrato..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
            Cancelar
          </button>
          <button form="editar-contrato-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><ScrollText className="w-4 h-4" /> Guardar Cambios</>}
          </button>
        </div>
      </aside>
    </>
  )
}
