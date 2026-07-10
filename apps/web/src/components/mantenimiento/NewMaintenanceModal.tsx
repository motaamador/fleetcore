'use client'

import { useState, useTransition } from 'react'
import { X, Wrench, Loader2, Calendar, ClipboardList, Building } from 'lucide-react'
import { createMaintenanceAction } from '@/app/dashboard/mantenimiento/actions'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Vehicle { id: string; plate_number: string; make: string; model: string }

interface NewMaintenanceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  vehicles: Vehicle[]
}

interface FormData {
  vehicle_id: string
  type: string
  status: string
  description: string
  workshop: string
  cost: string
  currency: string
  scheduled_date: string
  notes: string
}


const INITIAL_FORM: FormData = {
  vehicle_id:            '',
  type:                  'preventivo',
  status:                'programado',
  description:           '',
  workshop:              '',
  cost:                  '',
  currency:              'USD',
  scheduled_date:        new Date().toISOString().split('T')[0],
  notes:                 '',
}

const TYPE_OPTIONS = [
  { value: 'preventivo',  label: '🔧 Preventivo',  desc: 'Mantenimiento planificado' },
  { value: 'correctivo',  label: '🛠️ Correctivo',  desc: 'Reparación de falla' },
  { value: 'revision',    label: '🔍 Revisión',     desc: 'Inspección técnica' },
  { value: 'emergencia',  label: '🚨 Emergencia',   desc: 'Falla crítica urgente' },
]

const STATUS_OPTIONS = [
  { value: 'programado',  label: 'Programado' },
  { value: 'en_proceso',  label: 'En Proceso' },
  { value: 'completado',  label: 'Completado' },
  { value: 'cancelado',   label: 'Cancelado' },
]

const CURRENCY_OPTIONS = ['USD', 'EUR', 'VES']

// ── Componente ───────────────────────────────────────────────────────────────
export function NewMaintenanceModal({ open, onClose, onSuccess, vehicles }: NewMaintenanceModalProps) {
  const [form, setForm]     = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const e: Partial<FormData> = {}
    if (!form.vehicle_id)         e.vehicle_id    = 'Selecciona un vehículo'
    if (!form.description.trim()) e.description   = 'La descripción es requerida'
    if (!form.scheduled_date)     e.scheduled_date = 'La fecha es requerida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await createMaintenanceAction({
          vehicle_id:     form.vehicle_id,
          type:           form.type,
          status:         form.status,
          description:    form.description.trim(),
          workshop:       form.workshop.trim() || null,
          cost:           form.cost ? parseFloat(form.cost) : 0,
          currency:       form.currency,
          scheduled_date: form.scheduled_date,
          notes:          form.notes.trim() || null,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ description: `Error: ${err.message}` })
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

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning-bg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-warning-text" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nuevo Mantenimiento</h2>
              <p className="text-xs text-text-muted">Registra un servicio de la flota</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form id="nuevo-mantenimiento-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Vehículo */}
          <div>
            <label className="label">Vehículo <span className="text-danger">*</span></label>
            <select
              className={`input ${errors.vehicle_id ? 'border-danger' : ''}`}
              value={form.vehicle_id}
              onChange={e => set('vehicle_id', e.target.value)}
            >
              <option value="">— Seleccionar vehículo —</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} — {v.make} {v.model}
                </option>
              ))}
            </select>
            {errors.vehicle_id && <p className="text-xs text-danger mt-1">{errors.vehicle_id}</p>}
          </div>

          {/* Tipo de Mantenimiento */}
          <div>
            <label className="label">Tipo de Servicio <span className="text-danger">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('type', opt.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    form.type === opt.value
                      ? 'border-primary bg-primary-50'
                      : 'border-border bg-background hover:border-border-strong'
                  }`}
                >
                  <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Estado y Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                Fecha Programada <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className={`input ${errors.scheduled_date ? 'border-danger' : ''}`}
                value={form.scheduled_date}
                onChange={e => set('scheduled_date', e.target.value)}
              />
              {errors.scheduled_date && (
                <p className="text-xs text-danger mt-1">{errors.scheduled_date}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="label">
              <ClipboardList className="w-3.5 h-3.5" /> Descripción del Servicio <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              className={`input resize-none ${errors.description ? 'border-danger' : ''}`}
              placeholder="Ej: Cambio de aceite 15W40, filtro de aceite y filtro de aire..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
            {errors.description && <p className="text-xs text-danger mt-1">{errors.description}</p>}
          </div>

          {/* Taller */}
          <div>
            <label className="label">
              <Building className="w-3.5 h-3.5" /> Taller / Proveedor
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Taller Mecánico Central"
              value={form.workshop}
              onChange={e => set('workshop', e.target.value)}
            />
          </div>

          {/* Costo y Moneda */}
          <div className="grid grid-cols-3 gap-3 items-start">
            <div className="col-span-2">
              <label className="label">Costo Estimado</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="0.00"
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="label">Notas Adicionales</label>
            <textarea
              rows={2}
              className="input resize-none"
              placeholder="Observaciones, repuestos requeridos, etc."
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
          <button form="nuevo-mantenimiento-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[160px] justify-center">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><Wrench className="w-4 h-4" /> Registrar Servicio</>
            }
          </button>
        </div>

      </aside>
    </>
  )
}
