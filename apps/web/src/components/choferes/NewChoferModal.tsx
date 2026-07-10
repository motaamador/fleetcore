'use client'

import { useState, useTransition } from 'react'
import { X, UserPlus, Phone, CreditCard, FileText, Loader2, Users } from 'lucide-react'
import { createChofer } from '@/app/dashboard/choferes/actions'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface NewChoferModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  full_name: string
  cedula_identidad: string
  phone_number: string
  licencia_tipo: string
  role: 'driver' | 'dispatcher'
}

const INITIAL_FORM: FormData = {
  full_name: '',
  cedula_identidad: '',
  phone_number: '',
  licencia_tipo: '5ta', // Por defecto una licencia de carga pesada común
  role: 'driver',
}

const LICENCIAS = ['3ra', '4ta', '5ta', '6ta', 'Especial']

// ── Componente ───────────────────────────────────────────────────────────────
export function NewChoferModal({ open, onClose, onSuccess }: NewChoferModalProps) {
  const [form, setForm]         = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors]     = useState<Partial<FormData>>({})
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const newErrors: Partial<FormData> = {}
    if (!form.full_name.trim()) newErrors.full_name = 'El nombre completo es requerido'
    if (!form.cedula_identidad.trim()) newErrors.cedula_identidad = 'La cédula es requerida'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await createChofer({
          id:               crypto.randomUUID(),
          full_name:        form.full_name.trim(),
          cedula_identidad: form.cedula_identidad.trim(),
          phone_number:     form.phone_number.trim() || null,
          licencia_tipo:    form.licencia_tipo,
          role:             form.role,
          is_active:        true,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        console.error('Error al registrar chofer:', err)
        setErrors({ full_name: `Error: ${err.message}` })
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
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Registrar Chofer</h2>
              <p className="text-xs text-text-muted">Añade personal operativo a la flota</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form id="nuevo-chofer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          
          {/* Nombre */}
          <div>
            <label className="label">
              <Users className="w-3.5 h-3.5" /> Nombre Completo <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`input ${errors.full_name ? 'border-danger' : ''}`}
              placeholder="Ej: Carlos Mendoza"
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
            />
            {errors.full_name && <p className="text-xs text-danger mt-1">{errors.full_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* C.I. */}
            <div>
              <label className="label">
                <CreditCard className="w-3.5 h-3.5" /> Cédula (C.I.) <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`input ${errors.cedula_identidad ? 'border-danger' : ''}`}
                placeholder="V-12345678"
                value={form.cedula_identidad}
                onChange={(e) => set('cedula_identidad', e.target.value)}
              />
              {errors.cedula_identidad && <p className="text-xs text-danger mt-1">{errors.cedula_identidad}</p>}
            </div>

            {/* Licencia */}
            <div>
              <label className="label">
                <FileText className="w-3.5 h-3.5" /> Tipo Licencia
              </label>
              <select className="input" value={form.licencia_tipo} onChange={(e) => set('licencia_tipo', e.target.value)}>
                {LICENCIAS.map(l => (
                  <option key={l} value={l}>Grado {l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="label">
              <Phone className="w-3.5 h-3.5" /> Teléfono
            </label>
            <input
              type="tel"
              className="input"
              placeholder="Ej: 0412-5550000"
              value={form.phone_number}
              onChange={(e) => set('phone_number', e.target.value)}
            />
          </div>

          {/* Rol */}
          <div>
            <label className="label">Rol Operativo</label>
            <select className="input" value={form.role} onChange={(e) => set('role', e.target.value as any)}>
              <option value="driver">Chofer / Conductor</option>
              <option value="dispatcher">Despachador</option>
            </select>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
            Cancelar
          </button>
          <button form="nuevo-chofer-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Guardar Perfil</>
            )}
          </button>
        </div>

      </aside>
    </>
  )
}
