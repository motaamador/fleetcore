'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, HardHat, MapPin, Building2, DollarSign, CalendarDays, FileText, Loader2 } from 'lucide-react'
import { updateObra } from '@/app/dashboard/obras/actions'
import type { Currency, ProjectStatus, Project } from '@fleetcore/types'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface EditObraModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  obra: Project
}

interface FormData {
  name: string
  client_name: string
  location: string
  description: string
  budget: string
  currency: Currency
  status: ProjectStatus
  start_date: string
  end_date: string
  start_date_display: string
  end_date_display: string
}

// ── Constantes ───────────────────────────────────────────────────────────────
const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'USD',  symbol: '$'   },
  { value: 'EUR', label: 'EUR',  symbol: '€'   },
  { value: 'VES', label: 'Bs.', symbol: 'Bs.' },
]

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning',  label: 'En Planificación' },
  { value: 'active',    label: 'Activo'           },
  { value: 'on_hold',   label: 'En Pausa'         },
  { value: 'completed', label: 'Completado'       },
]

const INITIAL_FORM: FormData = {
  name: '', client_name: '', location: '', description: '',
  budget: '', currency: 'USD', status: 'planning',
  start_date: '', end_date: '',
  start_date_display: '', end_date_display: '',
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

// ── Componente ───────────────────────────────────────────────────────────────
export function EditObraModal({ open, onClose, onSuccess, obra }: EditObraModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isPending, startTransition] = useTransition()

  // Sincronizar datos de la obra cuando se abre el modal
  useEffect(() => {
    if (open && obra) {
      setForm({
        name: obra.name,
        client_name: obra.client_name || '',
        location: obra.location || '',
        description: obra.description || '',
        budget: obra.budget ? String(obra.budget) : '',
        currency: (obra.currency as Currency) || 'USD',
        status: (obra.status as ProjectStatus) || 'planning',
        start_date: obra.start_date || '',
        end_date: obra.end_date || '',
        start_date_display: isoToDisplay(obra.start_date || ''),
        end_date_display: isoToDisplay(obra.end_date || ''),
      })
    }
  }, [open, obra])

  if (!open) return null

  // ── Handlers ────────────────────────────────────────────────────────────────
  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const newErrors: Partial<FormData> = {}
    if (!form.name.trim())     newErrors.name     = 'El nombre es requerido'
    if (!form.location.trim()) newErrors.location = 'La ubicación es requerida'
    if (form.budget && isNaN(parseFloat(form.budget))) {
      newErrors.budget = 'Ingresa un monto válido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await updateObra(obra.id, {
          name:        form.name.trim(),
          client_name: form.client_name.trim() || null,
          location:    form.location.trim() || null,
          description: form.description.trim() || null,
          budget:      form.budget ? parseFloat(form.budget) : 0,
          currency:    form.currency,
          status:      form.status,
          start_date:  displayToISO(form.start_date_display),
          end_date:    displayToISO(form.end_date_display),
        })

        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ name: `Error al actualizar la obra: ${err.message}` })
      }
    })
  }

  function handleClose() {
    onClose()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* Panel lateral */}
      <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl z-50 flex flex-col">

        {/* Header del panel */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Editar Obra</h2>
              <p className="text-xs text-text-muted">Actualiza la información del proyecto</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con scroll */}
        <form id="editar-obra-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Nombre */}
          <div>
            <label className="label">
              <HardHat className="w-3.5 h-3.5" />
              Nombre de la Obra <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`input ${errors.name ? 'border-danger' : ''}`}
              placeholder="Ej: Autopista Norte Fase 2"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
          </div>

          {/* Cliente */}
          <div>
            <label className="label">
              <Building2 className="w-3.5 h-3.5" />
              Cliente / Contratante
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Ministerio de Infraestructura"
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="label">
              <MapPin className="w-3.5 h-3.5" />
              Ubicación <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`input ${errors.location ? 'border-danger' : ''}`}
              placeholder="Ej: Km 18, Ruta 001 — Sector Norte"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
            {errors.location && <p className="text-xs text-danger mt-1">{errors.location}</p>}
          </div>

          {/* Presupuesto + Moneda */}
          <div>
            <label className="label">
              <DollarSign className="w-3.5 h-3.5" />
              Presupuesto
            </label>
            <div className="flex gap-2">
              {/* Input del monto */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-muted select-none">
                  {CURRENCIES.find((c) => c.value === form.currency)?.symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`input pl-10 ${errors.budget ? 'border-danger' : ''}`}
                  placeholder="0.00"
                  value={form.budget}
                  onChange={(e) => set('budget', e.target.value)}
                />
              </div>
              {/* Selector de moneda — segmented control */}
              <div className="flex rounded-lg border border-border overflow-hidden flex-shrink-0">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('currency', c.value)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      form.currency === c.value
                        ? 'bg-primary text-white'
                        : 'bg-background text-text-secondary hover:bg-background-muted'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            {errors.budget && <p className="text-xs text-danger mt-1">{errors.budget}</p>}
          </div>

          {/* Estado */}
          <div>
            <label className="label">Estado inicial</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="label">
              <FileText className="w-3.5 h-3.5" />
              Descripción
            </label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Descripción breve del proyecto..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Fechas con Hack de UI */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                <CalendarDays className="w-3.5 h-3.5" />
                Fecha de Inicio
              </label>
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
                <CalendarDays className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label">
                <CalendarDays className="w-3.5 h-3.5" />
                Fecha de Fin
              </label>
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
                <CalendarDays className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

        </form>

        {/* Footer con acciones */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            form="editar-obra-form"
            type="submit"
            disabled={isPending}
            className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><HardHat className="w-4 h-4" /> Guardar Cambios</>
            )}
          </button>
        </div>

      </aside>
    </>
  )
}
