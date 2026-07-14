'use client'

import { useState, useTransition } from 'react'
import { X, Navigation, MapPin, Truck, Users, HardHat, Package, Plus, Trash2, Loader2, Edit2 } from 'lucide-react'
import { updateTripAction } from '@/app/dashboard/fletes/actions'
import type { StopType, Project, Vehicle, Profile, Trip, TripStop } from '@fleetcore/types'

interface EditFleteModalProps {
  open:     boolean
  onClose:  () => void
  trip:     Trip & { trip_stops?: TripStop[] }
  projects: Pick<Project, 'id' | 'name' | 'location'>[]
  vehicles: Pick<Vehicle, 'id' | 'plate_number' | 'make' | 'model'>[]
  drivers:  Pick<Profile, 'id' | 'full_name'>[]
}

interface StopData {
  id:        string
  location:  string
  stop_type: StopType
  notes:     string
}

interface FormData {
  project_id:  string
  vehicle_id:  string
  driver_id:   string
  origin:      string
  destination: string
  distance_km: string
  notes:       string
}

export function EditFleteModal({ open, onClose, trip, projects, vehicles, drivers }: EditFleteModalProps) {
  const [form, setForm]       = useState<FormData>({
    project_id:  trip.project_id  ?? '',
    vehicle_id:  trip.vehicle_id  ?? '',
    driver_id:   trip.driver_id   ?? '',
    origin:      trip.origin      ?? '',
    destination: trip.destination ?? '',
    distance_km: trip.distance_km?.toString() ?? '',
    notes:       (trip as any).notes ?? '',
  })
  const [stops, setStops]       = useState<StopData[]>(
    (trip.trip_stops ?? [])
      .sort((a, b) => a.stop_order - b.stop_order)
      .map(s => ({
        id:        s.id,
        location:  s.location,
        stop_type: s.stop_type,
        notes:     s.notes ?? '',
      }))
  )
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [isPending, startTx]    = useTransition()

  if (!open) return null

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function addStop() {
    setStops(prev => [...prev, { id: Math.random().toString(36).slice(2), location: '', stop_type: 'loading', notes: '' }])
  }
  function updateStop(id: string, field: keyof StopData, value: string) {
    setStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }
  function removeStop(id: string) {
    setStops(prev => prev.filter(s => s.id !== id))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.origin.trim())      e.origin      = 'Origen requerido'
    if (!form.destination.trim()) e.destination = 'Destino requerido'
    if (!form.vehicle_id)         e.vehicle_id  = 'Selecciona un vehículo'
    if (!form.driver_id)          e.driver_id   = 'Selecciona un conductor'
    stops.forEach((s, i) => { if (!s.location.trim()) e[`stop_${i}`] = 'Ubicación requerida' })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTx(async () => {
      const result = await updateTripAction(trip.id, {
        project_id:  form.project_id  || null,
        vehicle_id:  form.vehicle_id,
        driver_id:   form.driver_id,
        origin:      form.origin.trim(),
        destination: form.destination.trim(),
        distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
        notes:       form.notes.trim() || null,
      }, stops.map(s => ({ location: s.location, stop_type: s.stop_type, notes: s.notes || null })))

      if (!result.success && 'error' in result) {
        setErrors({ general: result.error })
      } else {
        onClose()
      }
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 w-full max-w-2xl bg-surface border-l border-border shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning-bg flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-warning-text" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Editar Flete</h2>
              <p className="text-xs text-text-muted">
                {trip.origin} → {trip.destination}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="edit-flete-form" onSubmit={handleSubmit} className="space-y-8">

            {errors.general && (
              <div className="bg-danger-bg text-danger p-3 rounded text-sm">{errors.general}</div>
            )}

            {/* Asignaciones */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">1. Asignaciones</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label"><HardHat className="w-3.5 h-3.5" /> Obra / Proyecto</label>
                  <select className="input" value={form.project_id} onChange={e => set('project_id', e.target.value)}>
                    <option value="">— Traslado Interno —</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.location})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label"><Truck className="w-3.5 h-3.5" /> Vehículo <span className="text-danger">*</span></label>
                  <select className={`input ${errors.vehicle_id ? 'border-danger' : ''}`} value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}>
                    <option value="" disabled>Seleccionar...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} · {v.make} {v.model}</option>)}
                  </select>
                  {errors.vehicle_id && <p className="text-xs text-danger mt-1">{errors.vehicle_id}</p>}
                </div>
                <div>
                  <label className="label"><Users className="w-3.5 h-3.5" /> Conductor <span className="text-danger">*</span></label>
                  <select className={`input ${errors.driver_id ? 'border-danger' : ''}`} value={form.driver_id} onChange={e => set('driver_id', e.target.value)}>
                    <option value="" disabled>Seleccionar...</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                  {errors.driver_id && <p className="text-xs text-danger mt-1">{errors.driver_id}</p>}
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Ruta */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">2. Ruta Principal</h3>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[11px] top-4 bottom-4 w-px bg-border" />
                <div className="relative flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 border-2 border-surface">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="flex-1">
                    <label className="label text-xs">Origen <span className="text-danger">*</span></label>
                    <input type="text" className={`input ${errors.origin ? 'border-danger' : ''}`} value={form.origin} onChange={e => set('origin', e.target.value)} />
                    {errors.origin && <p className="text-xs text-danger mt-1">{errors.origin}</p>}
                  </div>
                </div>
                <div className="relative flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center flex-shrink-0 mt-1 border-2 border-surface">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="label text-xs">Destino Final <span className="text-danger">*</span></label>
                    <input type="text" className={`input ${errors.destination ? 'border-danger' : ''}`} value={form.destination} onChange={e => set('destination', e.target.value)} />
                    {errors.destination && <p className="text-xs text-danger mt-1">{errors.destination}</p>}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Distancia (Km)</label>
                  <input type="number" step="0.1" className="input" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} />
                </div>
                <div>
                  <label className="label">Notas</label>
                  <input type="text" className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observaciones..." />
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Paradas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">3. Paradas Intermedias</h3>
                <button type="button" onClick={addStop} className="btn-secondary py-1 text-xs flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              {stops.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background-muted/50">
                  <Package className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-text-secondary">Ruta directa sin paradas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stops.map((stop, idx) => (
                    <div key={stop.id} className="relative p-4 rounded-lg border border-border bg-background">
                      <span className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center border border-primary/20">
                        {idx + 1}
                      </span>
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                          <label className="label text-[11px]">Acción</label>
                          <select className="input py-1.5" value={stop.stop_type} onChange={e => updateStop(stop.id, 'stop_type', e.target.value as StopType)}>
                            <option value="loading">Carga</option>
                            <option value="unloading">Descarga</option>
                          </select>
                        </div>
                        <div className="col-span-7">
                          <label className="label text-[11px]">Ubicación <span className="text-danger">*</span></label>
                          <input type="text" className={`input py-1.5 ${errors[`stop_${idx}`] ? 'border-danger' : ''}`} value={stop.location} onChange={e => updateStop(stop.id, 'location', e.target.value)} />
                        </div>
                        <div className="col-span-1 flex items-end justify-end">
                          <button type="button" onClick={() => removeStop(stop.id)} className="p-2 text-text-muted hover:text-danger hover:bg-danger-bg rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="col-span-11">
                          <input type="text" className="input py-1.5 text-sm" placeholder="Notas (opcional)" value={stop.notes} onChange={e => updateStop(stop.id, 'notes', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={isPending} className="btn-secondary">Cancelar</button>
          <button form="edit-flete-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Navigation className="w-4 h-4" /> Guardar Cambios</>}
          </button>
        </div>
      </aside>
    </>
  )
}
