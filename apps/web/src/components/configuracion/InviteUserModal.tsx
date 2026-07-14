'use client'

import { useState, useTransition } from 'react'
import { UserPlus, X, Loader2, Send } from 'lucide-react'
import { inviteUserAction } from '@/app/dashboard/configuracion/actions'

const ROLES = [
  { value: 'admin',      label: 'Administrador' },
  { value: 'dispatcher', label: 'Despachador' },
  { value: 'finance',    label: 'Finanzas' },
  { value: 'driver',     label: 'Chofer' },
]

export function InviteUserModal() {
  const [open, setOpen]         = useState(false)
  const [isPending, startTx]    = useTransition()
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)
  const [form, setForm]         = useState({
    email:        '',
    full_name:    '',
    role:         'driver',
    phone_number: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleClose() {
    setOpen(false)
    setError(null)
    setSuccess(null)
    setForm({ email: '', full_name: '', role: 'driver', phone_number: '' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTx(async () => {
      const result = await inviteUserAction(form)
      if (result.success) {
        setSuccess('message' in result ? (result.message ?? 'Invitación enviada.') : 'Invitación enviada.')
        setTimeout(handleClose, 1800)
      } else {
        setError('error' in result ? result.error : 'Error al enviar la invitación.')
      }
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
        <UserPlus className="w-4 h-4" />
        Invitar Usuario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-primary-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Invitar Usuario</h2>
                  <p className="text-xs text-text-muted">Se enviará un email de invitación</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-background flex items-center justify-center text-text-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Email *</label>
                <input
                  type="email" name="email" required
                  value={form.email} onChange={handleChange}
                  placeholder="usuario@empresa.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Nombre Completo *</label>
                <input
                  type="text" name="full_name" required
                  value={form.full_name} onChange={handleChange}
                  placeholder="Juan Pérez"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Rol *</label>
                  <select name="role" value={form.role} onChange={handleChange} className="input-field">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="tel" name="phone_number"
                    value={form.phone_number} onChange={handleChange}
                    placeholder="+58 424 0000000"
                    className="input-field"
                  />
                </div>
              </div>

              {error   && <div className="p-3 rounded-lg bg-danger-bg text-sm text-danger border border-danger/20">{error}</div>}
              {success && <div className="p-3 rounded-lg bg-success-bg text-sm text-success-text border border-success/20">{success}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary flex-1 text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isPending ? 'Enviando…' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
