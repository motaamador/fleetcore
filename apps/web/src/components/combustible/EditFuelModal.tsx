'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, Fuel, Loader2, Calendar, MapPin, Truck, User } from 'lucide-react'
import { updateFuelAction } from '@/app/dashboard/combustible/actions'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Vehicle { id: string; plate_number: string; make: string; model: string }
interface Driver { id: string; full_name: string; role: string }

interface EditFuelModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  vehicles: Vehicle[]
  drivers: Driver[]
  record: any
}

interface FormData {
  vehicle_id:   string
  driver_id:    string
  date:         string
  liters:       string
  cost:         string
  currency:     string
  odometer:     string
  station_name: string
  notes:        string
}

const INITIAL_FORM: FormData = {
  vehicle_id:   '',
  driver_id:    '',
  date:         new Date().toISOString().split('T')[0],
  liters:       '',
  cost:         '',
  currency:     'USD',
  odometer:     '',
  station_name: '',
  notes:        '',
}

const CURRENCIES = ['USD', 'EUR', 'VES']

// ── Componente ─────────────────────────────────────────────────────────────────
export function EditFuelModal({ open, onClose, onSuccess, vehicles, drivers, record }: EditFuelModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && record) {
      setForm({
        vehicle_id: record.vehicle_id || '',
        driver_id: record.driver_id || '',
        date: record.date || new Date().toISOString().split('T')[0],
        liters: record.liters ? String(record.liters) : '',
        cost: record.cost ? String(record.cost) : '',
        currency: record.currency || 'USD',
        odometer: record.odometer ? String(record.odometer) : '',
        station_name: record.station_name || '',
        notes: record.notes || ''
      })
    }
  }, [open, record])

  if (!open) return null

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const e: Partial<FormData> = {}
    if (!form.vehicle_id) e.vehicle_id = 'Selecciona un vehículo'
    if (!form.liters || parseFloat(form.liters) <= 0) e.liters = 'Ingresa una cantidad válida'
    if (!form.cost || parseFloat(form.cost) < 0) e.cost = 'Ingresa un costo válido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await updateFuelAction(record.id, {
          vehicle_id:   form.vehicle_id,
          driver_id:    form.driver_id || null,
          date:         form.date,
          liters:       parseFloat(form.liters),
          cost:         parseFloat(form.cost),
          currency:     form.currency,
          odometer:     form.odometer ? parseFloat(form.odometer) : null,
          station_name: form.station_name.trim() || null,
          notes:        form.notes.trim() || null,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ notes: `Error: ${err.message}` })
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
            <div className="w-9 h-9 rounded-lg bg-danger-bg flex items-center justify-center">
              <Fuel className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Editar Carga de Combustible</h2>
              <p className="text-xs text-text-muted">Ingresa los detalles del suministro</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form id="editar-combustible-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Vehículo y Chofer */}
          <div className="space-y-4">
            <div>
              <label className="label"><Truck className="w-3.5 h-3.5" /> Vehículo <span className="text-danger">*</span></label>
              <select
                className={`input ${errors.vehicle_id ? 'border-danger' : ''}`}
                value={form.vehicle_id}
                onChange={e => set('vehicle_id', e.target.value)}
              >
                <option value="">— Seleccionar vehículo —</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate_number} — {v.make} {v.model}</option>
                ))}
              </select>
              {errors.vehicle_id && <p className="text-xs text-danger mt-1">{errors.vehicle_id}</p>}
            </div>
            <div>
              <label className="label"><User className="w-3.5 h-3.5" /> Chofer (Opcional)</label>
              <select
                className="input"
                value={form.driver_id}
                onChange={e => set('driver_id', e.target.value)}
              >
                <option value="">— Seleccionar chofer —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Detalles de carga */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cantidad (Litros) <span className="text-danger">*</span></label>
              <input
                type="number" step="0.01" min="0"
                className={`input ${errors.liters ? 'border-danger' : ''}`}
                placeholder="0.00"
                value={form.liters}
                onChange={e => set('liters', e.target.value)}
              />
              {errors.liters && <p className="text-xs text-danger mt-1">{errors.liters}</p>}
            </div>
            <div>
              <label className="label">Odómetro (Km)</label>
              <input
                type="number" step="0.1" min="0"
                className="input"
                placeholder="Kilometraje actual"
                value={form.odometer}
                onChange={e => set('odometer', e.target.value)}
              />
            </div>
          </div>

          {/* Costo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Costo Total <span className="text-danger">*</span></label>
              <input
                type="number" step="0.01" min="0"
                className={`input ${errors.cost ? 'border-danger' : ''}`}
                placeholder="0.00"
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
              />
              {errors.cost && <p className="text-xs text-danger mt-1">{errors.cost}</p>}
            </div>
            <div>
              <label className="label">Moneda</label>
              <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Fecha y Estación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label"><Calendar className="w-3.5 h-3.5" /> Fecha</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>
            <div>
              <label className="label"><MapPin className="w-3.5 h-3.5" /> Estación</label>
              <input
                type="text"
                className="input"
                placeholder="Nombre de la bomba"
                value={form.station_name}
                onChange={e => set('station_name', e.target.value)}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="label">Observaciones</label>
            <textarea
              rows={2}
              className="input resize-none"
              placeholder="Ej: Llenado de tanque auxiliar..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
            {errors.notes && <p className="text-xs text-danger mt-1">{errors.notes}</p>}
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
            Cancelar
          </button>
          <button form="editar-combustible-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[150px] justify-center">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><Fuel className="w-4 h-4" /> Guardar Cambios</>
            }
          </button>
        </div>

      </aside>
    </>
  )
}
