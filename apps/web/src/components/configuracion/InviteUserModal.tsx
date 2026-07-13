'use client'

import { useState, useTransition } from 'react'
import { UserPlus, X, Loader2 } from 'lucide-react'
import { inviteUserAction } from '@/app/dashboard/configuracion/actions'

const ROLES = [
  { value: 'admin',      label: 'Administrador',  desc: 'Acceso total al sistema' },
  { value: 'dispatcher', label: 'Despachador',     desc: 'Gestiona fletes y camiones' },
  { value: 'finance',    label: 'Finanzas',         desc: 'Facturación, nóminas y reportes' },
  { value: 'driver',     label: 'Chofer',           desc: 'Solo ve sus propios fletes' },
]

export function InviteUserModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    email:        '',
    full_name:    '',
    role:         'driver' as string,
    phone_number: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await inviteUserAction(form)
      if (!result.success) {
        setError('error' in result ? result.error : 'Error desconocido')
      } else {
        setSuccess('message' in result ? (result.message ?? 'Invitación enviada') : 'Invitación enviada')
        setForm({ email: '', full_name: '', role: 'driver', phone_number: '' })
        setTimeout(() => { setOpen(false); setSuccess(null) }, 2500)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); setSuccess(null) }}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        <UserPlus className="w-4 h-4" />
        Invitar Usuario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Invitar Usuario</h2>
                <p className="text-sm text-text-muted mt-0.5">
                  Recibirá un email para crear su contraseña
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-background flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Nombre Completo <span className="text-danger">*</span>
                </label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  minLength={3}
                  placeholder="Juan Pérez"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="juan@empresa.com"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Teléfono
                </label>
                <input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+58 414 000 0000"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Rol <span className="text-danger">*</span>
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <p className="text-xs text-text-muted mt-1">
                  {ROLES.find(r => r.value === form.role)?.desc}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-danger-bg border border-danger/20 text-sm text-danger">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-success-bg border border-success/20 text-sm text-success-text">
                  ✓ {success}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1 text-sm"
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Enviar Invitación</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
