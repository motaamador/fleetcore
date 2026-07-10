'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, Truck, Hash, Wrench, Settings, Weight, Loader2, Calendar, FileBadge } from 'lucide-react'
import { updateCamion } from '@/app/dashboard/camiones/actions'
import type { VehicleType, VehicleStatus, Vehicle } from '@fleetcore/types'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface EditCamionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  vehiculo: Vehicle
}

interface FormData {
  plate_number: string
  make: string
  model: string
  year: string
  type: VehicleType
  capacity_kg: string
  status: VehicleStatus
  current_mileage: string
  rotc: string
}

// ── Constantes ───────────────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'truck',           label: 'Camión (Góndola/Volteo)' },
  { value: 'heavy_machinery', label: 'Maquinaria Pesada' },
  { value: 'van',             label: 'Van / Furgoneta' },
  { value: 'pickup',          label: 'Pickup 4x4' },
]

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'active',         label: 'Activo / Disponible' },
  { value: 'in_maintenance', label: 'En Mantenimiento' },
  { value: 'inactive',       label: 'Inactivo' },
]

const INITIAL_FORM: FormData = {
  plate_number: '', make: '', model: '', year: new Date().getFullYear().toString(),
  type: 'truck', capacity_kg: '', status: 'active', current_mileage: '0', rotc: '',
}

// ── Componente ───────────────────────────────────────────────────────────────
export function EditCamionModal({ open, onClose, onSuccess, vehiculo }: EditCamionModalProps) {
  const [form, setForm]         = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors]     = useState<Partial<FormData>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && vehiculo) {
      setForm({
        plate_number: vehiculo.plate_number,
        make: vehiculo.make,
        model: vehiculo.model,
        year: String(vehiculo.year),
        type: vehiculo.type as VehicleType,
        capacity_kg: vehiculo.capacity_kg ? String(vehiculo.capacity_kg) : '',
        status: vehiculo.status as VehicleStatus,
        current_mileage: String(vehiculo.current_mileage || 0),
        rotc: vehiculo.rotc || '',
      })
    }
  }, [open, vehiculo])

  if (!open) return null

  // ── Handlers ────────────────────────────────────────────────────────────────
  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const newErrors: Partial<FormData> = {}
    if (!form.plate_number.trim()) newErrors.plate_number = 'La placa es requerida'
    if (!form.make.trim())         newErrors.make         = 'La marca es requerida'
    if (!form.model.trim())        newErrors.model        = 'El modelo es requerido'
    
    const year = parseInt(form.year)
    if (isNaN(year) || year < 1980 || year > new Date().getFullYear() + 1) {
      newErrors.year = 'Año inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await updateCamion(vehiculo.id, {
          plate_number:    form.plate_number.trim().toUpperCase(),
          make:            form.make.trim(),
          model:           form.model.trim(),
          year:            parseInt(form.year),
          type:            form.type,
          capacity_kg:     form.capacity_kg ? parseFloat(form.capacity_kg) : null,
          status:          form.status,
          current_mileage: form.current_mileage ? parseFloat(form.current_mileage) : 0,
          rotc:            form.rotc.trim() || null,
        })
        onSuccess()
        onClose()
      } catch (err: any) {
        console.error('Error al actualizar vehículo:', err)
        if (err.message.includes('duplicate') || err.message.includes('23505')) {
          setErrors({ plate_number: 'Esta placa ya está registrada' })
        } else {
          setErrors({ make: `Error: ${err.message}` })
        }
      }
    })
  }

  function handleClose() {
    onClose()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClose} />

      <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl z-50 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Editar Vehículo</h2>
              <p className="text-xs text-text-muted">Modifica los datos del activo</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form id="editar-vehiculo-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          
          {/* Placa y Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <Hash className="w-3.5 h-3.5" />
                Placa / Matrícula <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`input uppercase ${errors.plate_number ? 'border-danger' : ''}`}
                placeholder="Ej: A12-3BC"
                value={form.plate_number}
                onChange={(e) => set('plate_number', e.target.value.toUpperCase())}
              />
              {errors.plate_number && <p className="text-xs text-danger mt-1">{errors.plate_number}</p>}
            </div>
            <div>
              <label className="label">Tipo de Vehículo</label>
              <select className="input" value={form.type} onChange={(e) => set('type', e.target.value as VehicleType)}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Marca, Modelo, Año */}
          <div className="grid grid-cols-12 gap-3 items-start">
            <div className="col-span-5">
              <label className="label">Marca <span className="text-danger">*</span></label>
              <input type="text" className={`input ${errors.make ? 'border-danger' : ''}`} placeholder="Ej: Volvo" value={form.make} onChange={(e) => set('make', e.target.value)} />
              {errors.make && <p className="text-xs text-danger mt-1 leading-tight">{errors.make}</p>}
            </div>
            <div className="col-span-5">
              <label className="label">Modelo <span className="text-danger">*</span></label>
              <input type="text" className={`input ${errors.model ? 'border-danger' : ''}`} placeholder="Ej: VNL 860" value={form.model} onChange={(e) => set('model', e.target.value)} />
              {errors.model && <p className="text-xs text-danger mt-1 leading-tight">{errors.model}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Año</label>
              <input type="number" className={`input px-1 text-center ${errors.year ? 'border-danger' : ''}`} value={form.year} onChange={(e) => set('year', e.target.value)} />
            </div>
          </div>

          {/* ROTC y Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <FileBadge className="w-3.5 h-3.5" />
                Permiso ROTC
              </label>
              <input 
                type="text" 
                className="input" 
                placeholder="Nº de Permiso (Opcional)" 
                value={form.rotc} 
                onChange={(e) => set('rotc', e.target.value)} 
              />
            </div>
            <div>
              <label className="label">
                <Wrench className="w-3.5 h-3.5" />
                Estado Operativo
              </label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as VehicleStatus)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Capacidad y Kilometraje */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <Weight className="w-3.5 h-3.5" />
                Capacidad (Kg)
              </label>
              <div className="relative">
                <input type="number" step="0.01" className="input pr-10" placeholder="Ej: 36000" value={form.capacity_kg} onChange={(e) => set('capacity_kg', e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted select-none">kg</span>
              </div>
            </div>
            <div>
              <label className="label">
                <Settings className="w-3.5 h-3.5" />
                Kilometraje Inicial
              </label>
              <div className="relative">
                <input type="number" step="0.01" className="input pr-10" placeholder="0" value={form.current_mileage} onChange={(e) => set('current_mileage', e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted select-none">km</span>
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
            Cancelar
          </button>
          <button form="editar-vehiculo-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><Truck className="w-4 h-4" /> Guardar Cambios</>
            )}
          </button>
        </div>

      </aside>
    </>
  )
}
