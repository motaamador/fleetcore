'use client'

import { useState, useTransition } from 'react'
import { X, MapPin, Truck, Users, HardHat, Package, Plus, Trash2, ArrowRight, Loader2, Navigation, Calendar } from 'lucide-react'
import { createTripAction } from '@/app/dashboard/fletes/actions'
import type { StopType, Project, Vehicle, Profile } from '@fleetcore/types'

interface NewFleteModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  projects: Pick<Project, 'id' | 'name' | 'location'>[]
  vehicles: Pick<Vehicle, 'id' | 'plate_number' | 'make' | 'model'>[]
  drivers: Pick<Profile, 'id' | 'full_name'>[]
  bcvRate: number | null
}

interface StopData {
  id: string // Identificador local para el renderizado
  location: string
  stop_type: StopType
  notes: string
}

interface FormData {
  project_id: string
  vehicle_id: string
  driver_id: string
  origin: string
  destination: string
  distance_km: string
  departure_time: string
  precio_flete: string
  precio_currency: string
  bono_chofer: string
  bono_currency: string
  viaticos: string
  viaticos_currency: string
}

const INITIAL_FORM: FormData = {
  project_id: '',
  vehicle_id: '',
  driver_id: '',
  origin: '',
  destination: '',
  distance_km: '',
  departure_time: '',
  precio_flete: '',
  precio_currency: 'USD',
  bono_chofer: '',
  bono_currency: 'USD',
  viaticos: '',
  viaticos_currency: 'USD',
}

export function NewFleteModal({ open, onClose, onSuccess, projects, vehicles, drivers, bcvRate }: NewFleteModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [stops, setStops] = useState<StopData[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  // ── Handlers de Paradas ──────────────────────────────────────────────────
  function addStop() {
    setStops((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(7), location: '', stop_type: 'loading', notes: '' }
    ])
  }

  function updateStop(id: string, field: keyof StopData, value: string) {
    setStops((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s))
  }

  function removeStop(id: string) {
    setStops((prev) => prev.filter((s) => s.id !== id))
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.origin.trim())      newErrors.origin      = 'Origen requerido'
    if (!form.destination.trim()) newErrors.destination = 'Destino requerido'
    if (!form.vehicle_id)         newErrors.vehicle_id  = 'Selecciona un vehículo'
    if (!form.driver_id)          newErrors.driver_id   = 'Selecciona un conductor'
    if (!form.departure_time)     newErrors.departure_time = 'Requerido'
    
    stops.forEach((stop, idx) => {
      if (!stop.location.trim()) newErrors[`stop_${idx}`] = 'Ubicación requerida'
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await createTripAction({
          project_id:  form.project_id || null,
          vehicle_id:  form.vehicle_id,
          driver_id:   form.driver_id,
          origin:      form.origin.trim(),
          destination: form.destination.trim(),
          distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
          departure_time: form.departure_time ? new Date(form.departure_time).toISOString() : null,
          precio_flete:      form.precio_flete ? parseFloat(form.precio_flete) : null,
          precio_currency:   form.precio_currency || 'USD',
          bono_chofer:       form.bono_chofer ? parseFloat(form.bono_chofer) : null,
          bono_currency:     form.bono_currency || 'USD',
          viaticos:          form.viaticos ? parseFloat(form.viaticos) : null,
          viaticos_currency: form.viaticos_currency || 'USD',
          status:      'scheduled'
        }, stops)
        handleClose()
        onSuccess()
      } catch (err: any) {
        setErrors({ general: `Error: ${err.message}` })
      }
    })
  }

  function handleClose() {
    setForm(INITIAL_FORM)
    setStops([])
    setErrors({})
    onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClose} />

      <aside className="fixed inset-y-0 right-0 w-full max-w-2xl bg-surface border-l border-border shadow-2xl z-50 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nuevo Flete</h2>
              <p className="text-xs text-text-muted">Programa un viaje y su ruta de entregas</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="nuevo-flete-form" onSubmit={handleSubmit} className="space-y-8">
            
            {errors.general && (
              <div className="bg-danger-bg text-danger p-3 rounded text-sm">{errors.general}</div>
            )}

            {/* SECCIÓN 1: ASIGNACIONES */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">1. Asignaciones</h3>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Obra */}
                <div className="col-span-2">
                  <label className="label"><HardHat className="w-3.5 h-3.5" /> Obra / Proyecto</label>
                  <select className="input" value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
                    <option value="">— Traslado Interno (Sin obra) —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                    ))}
                  </select>
                </div>

                {/* Vehículo */}
                <div>
                  <label className="label">
                    <Truck className="w-3.5 h-3.5" /> Vehículo <span className="text-danger">*</span>
                  </label>
                  <select className={`input ${errors.vehicle_id ? 'border-danger' : ''}`} value={form.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
                    <option value="" disabled>Seleccionar Vehículo...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.plate_number} · {v.make} {v.model}</option>
                    ))}
                  </select>
                  {errors.vehicle_id && <p className="text-xs text-danger mt-1">{errors.vehicle_id}</p>}
                </div>

                {/* Conductor */}
                <div>
                  <label className="label">
                    <Users className="w-3.5 h-3.5" /> Conductor <span className="text-danger">*</span>
                  </label>
                  <select className={`input ${errors.driver_id ? 'border-danger' : ''}`} value={form.driver_id} onChange={(e) => set('driver_id', e.target.value)}>
                    <option value="" disabled>Seleccionar Conductor...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                  {errors.driver_id && <p className="text-xs text-danger mt-1">{errors.driver_id}</p>}
                </div>

                {/* Fecha Programada */}
                <div>
                  <label className="label">
                    <Calendar className="w-3.5 h-3.5" /> Fecha Programada <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    className={`input ${errors.departure_time ? 'border-danger' : ''}`} 
                    value={form.departure_time} 
                    onChange={(e) => set('departure_time', e.target.value)} 
                  />
                  {errors.departure_time && <p className="text-xs text-danger mt-1">{errors.departure_time}</p>}
                </div>

              </div>
            </div>

            <hr className="border-border" />

            {/* SECCIÓN 2: RUTA PRINCIPAL */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">2. Ruta Principal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 relative pl-6 space-y-4">
                  {/* Línea vertical decorativa */}
                  <div className="absolute left-[11px] top-4 bottom-4 w-px bg-border z-0" />
                  
                  {/* Origen */}
                  <div className="relative z-10 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border-2 border-surface">
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="flex-1">
                      <label className="label text-xs">Punto de Origen <span className="text-danger">*</span></label>
                      <input type="text" className={`input ${errors.origin ? 'border-danger' : ''}`} placeholder="Ej: Planta Central" value={form.origin} onChange={(e) => set('origin', e.target.value)} />
                    </div>
                  </div>

                  {/* Destino */}
                  <div className="relative z-10 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border-2 border-surface">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <label className="label text-xs">Destino Final <span className="text-danger">*</span></label>
                      <input type="text" className={`input ${errors.destination ? 'border-danger' : ''}`} placeholder="Ej: Obra Autopista Norte" value={form.destination} onChange={(e) => set('destination', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="col-span-2 pt-2">
                  <label className="label">Distancia Estimada (Km)</label>
                  <input type="number" step="0.1" className="input max-w-[200px]" placeholder="Ej: 145" value={form.distance_km} onChange={(e) => set('distance_km', e.target.value)} />
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* SECCIÓN 3: PARADAS INTERMEDIAS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">3. Paradas Intermedias (Opcional)</h3>
                <button type="button" onClick={addStop} className="btn-secondary py-1 text-xs flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> Agregar Parada
                </button>
              </div>

              {stops.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background-muted/50">
                  <Package className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-text-secondary">Ruta directa. No hay paradas registradas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stops.map((stop, idx) => (
                    <div key={stop.id} className="relative p-4 rounded-lg border border-border bg-background shadow-sm">
                      <span className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center border border-primary/20">
                        {idx + 1}
                      </span>
                      
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                          <label className="label text-[11px]">Acción</label>
                          <select className="input py-1.5" value={stop.stop_type} onChange={(e) => updateStop(stop.id, 'stop_type', e.target.value)}>
                            <option value="loading">Carga</option>
                            <option value="unloading">Descarga</option>
                          </select>
                        </div>
                        <div className="col-span-7">
                          <label className="label text-[11px]">Ubicación <span className="text-danger">*</span></label>
                          <input type="text" className={`input py-1.5 ${errors[`stop_${idx}`] ? 'border-danger' : ''}`} placeholder="Ej: Almacén Valencia" value={stop.location} onChange={(e) => updateStop(stop.id, 'location', e.target.value)} />
                        </div>
                        <div className="col-span-1 flex items-end justify-end">
                          <button type="button" onClick={() => removeStop(stop.id)} className="p-2 text-text-muted hover:text-danger hover:bg-danger-bg rounded transition-colors" title="Eliminar parada">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="col-span-11">
                          <input type="text" className="input py-1.5 text-sm" placeholder="Notas (opcional, ej: Cargar 15 sacos de cemento)" value={stop.notes} onChange={(e) => updateStop(stop.id, 'notes', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN 4: FINANCIERO */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">4. Costos del Viaje</h3>
              <div className="space-y-4">

                {/* Precio al cliente */}
                <div className="p-3 rounded-lg border border-border bg-background">
                  <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">💰 Precio Cobrado al Cliente</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.precio_flete} onChange={(e) => set('precio_flete', e.target.value)} />
                    </div>
                    <div>
                      <select className="input w-24" value={form.precio_currency} onChange={(e) => set('precio_currency', e.target.value)}>
                        <option value="USD">USD</option>
                        <option value="VES">VES</option>
                      </select>
                    </div>
                  </div>
                  {bcvRate && form.precio_flete && form.precio_currency === 'USD' && (
                    <p className="text-xs text-text-muted mt-1">
                      Aprox: Bs. {(parseFloat(form.precio_flete) * bcvRate).toLocaleString('es-VE', {minimumFractionDigits: 2})} (Tasa: {bcvRate})
                    </p>
                  )}
                  {bcvRate && form.precio_currency === 'VES' && (
                    <div className="mt-1 flex items-center gap-2">
                      <button type="button" onClick={() => {
                        const usdVal = prompt('Monto del flete en USD:')
                        if (usdVal && !isNaN(Number(usdVal))) set('precio_flete', (Number(usdVal) * bcvRate).toFixed(2))
                      }} className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 px-2 py-0.5 rounded border border-primary-200 transition-colors">
                        Calcular desde USD (Tasa: {bcvRate})
                      </button>
                    </div>
                  )}
                </div>

                {/* Bono chofer */}
                <div className="p-3 rounded-lg border border-border bg-background">
                  <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">🚛 Bono / Comisión del Chofer</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.bono_chofer} onChange={(e) => set('bono_chofer', e.target.value)} />
                    </div>
                    <div>
                      <select className="input w-24" value={form.bono_currency} onChange={(e) => set('bono_currency', e.target.value)}>
                        <option value="USD">USD</option>
                        <option value="VES">VES</option>
                      </select>
                    </div>
                  </div>
                  {bcvRate && form.bono_chofer && form.bono_currency === 'USD' && (
                    <p className="text-xs text-text-muted mt-1">
                      Aprox: Bs. {(parseFloat(form.bono_chofer) * bcvRate).toLocaleString('es-VE', {minimumFractionDigits: 2})}
                    </p>
                  )}
                  {bcvRate && form.bono_currency === 'VES' && (
                    <div className="mt-1 flex items-center gap-2">
                      <button type="button" onClick={() => {
                        const usdVal = prompt('Bono en USD:')
                        if (usdVal && !isNaN(Number(usdVal))) set('bono_chofer', (Number(usdVal) * bcvRate).toFixed(2))
                      }} className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 px-2 py-0.5 rounded border border-primary-200 transition-colors">
                        Calcular desde USD
                      </button>
                    </div>
                  )}
                </div>

                {/* Viáticos */}
                <div className="p-3 rounded-lg border border-border bg-background">
                  <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">🛣️ Viáticos (Peajes / Comida)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.viaticos} onChange={(e) => set('viaticos', e.target.value)} />
                    </div>
                    <div>
                      <select className="input w-24" value={form.viaticos_currency} onChange={(e) => set('viaticos_currency', e.target.value)}>
                        <option value="USD">USD</option>
                        <option value="VES">VES</option>
                      </select>
                    </div>
                  </div>
                  {bcvRate && form.viaticos && form.viaticos_currency === 'USD' && (
                    <p className="text-xs text-text-muted mt-1">
                      Aprox: Bs. {(parseFloat(form.viaticos) * bcvRate).toLocaleString('es-VE', {minimumFractionDigits: 2})}
                    </p>
                  )}
                  {bcvRate && form.viaticos_currency === 'VES' && (
                    <div className="mt-1 flex items-center gap-2">
                      <button type="button" onClick={() => {
                        const usdVal = prompt('Viáticos en USD:')
                        if (usdVal && !isNaN(Number(usdVal))) set('viaticos', (Number(usdVal) * bcvRate).toFixed(2))
                      }} className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 px-2 py-0.5 rounded border border-primary-200 transition-colors">
                        Calcular desde USD
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
            Cancelar
          </button>
          <button form="nuevo-flete-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Programando...</>
            ) : (
              <><Navigation className="w-4 h-4" /> Programar Flete</>
            )}
          </button>
        </div>

      </aside>
    </>
  )
}
