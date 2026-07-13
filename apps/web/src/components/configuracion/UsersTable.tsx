'use client'

import { useState, useTransition } from 'react'
import { Shield, UserCheck, UserX, Trash2, Edit2, X, Loader2, Check } from 'lucide-react'
import { toggleUserStatusAction, updateUserProfileAction, deleteUserAction } from '@/app/dashboard/configuracion/actions'

type Profile = {
  id: string
  full_name: string
  role: string
  phone_number: string | null
  is_active: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:      { label: 'Admin',       color: 'bg-primary-50 text-primary-700 border-primary-100' },
  dispatcher: { label: 'Despachador', color: 'bg-info-bg text-info-text border-info-text/20' },
  finance:    { label: 'Finanzas',    color: 'bg-success-bg text-success-text border-success/20' },
  driver:     { label: 'Chofer',      color: 'bg-warning-bg text-warning-text border-warning/20' },
}

const ROLES = ['admin', 'dispatcher', 'finance', 'driver']

function EditUserModal({
  user,
  onClose,
}: {
  user: Profile
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name:    user.full_name,
    role:         user.role,
    phone_number: user.phone_number ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updateUserProfileAction(user.id, form)
      if (!result.success) setError('error' in result ? result.error : 'Error')
      else onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Editar Usuario</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-background flex items-center justify-center text-text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Nombre Completo</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} required className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Teléfono</label>
            <input name="phone_number" value={form.phone_number} onChange={handleChange} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Rol</label>
            <select name="role" value={form.role} onChange={handleChange} className="input-field w-full">
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]?.label ?? r}</option>)}
            </select>
          </div>
          {error && <div className="p-3 rounded-lg bg-danger-bg text-sm text-danger">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isPending} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UsersTable({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition()
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  function handleToggle(userId: string, current: boolean) {
    setPendingId(userId)
    startTransition(async () => {
      await toggleUserStatusAction(userId, !current)
      setPendingId(null)
    })
  }

  function handleDelete(userId: string, name: string) {
    if (!confirm(`¿Eliminar permanentemente a "${name}"? Esta acción no se puede deshacer.`)) return
    setPendingId(userId)
    startTransition(async () => {
      await deleteUserAction(userId)
      setPendingId(null)
    })
  }

  return (
    <>
      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Usuario</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Rol</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide hidden md:table-cell">Teléfono</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Estado</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {profiles.map(profile => {
              const roleInfo = ROLE_LABELS[profile.role] ?? { label: profile.role, color: 'bg-border text-text-secondary' }
              const isCurrentUser = profile.id === currentUserId
              const loading = pendingId === profile.id

              return (
                <tr key={profile.id} className={`hover:bg-background/50 transition-colors ${!profile.is_active ? 'opacity-60' : ''}`}>
                  {/* Usuario */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${profile.is_active ? 'bg-primary text-white' : 'bg-border text-text-muted'}`}>
                        {profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {profile.full_name}
                          {isCurrentUser && <span className="ml-2 text-xs text-primary-light font-normal">(Tú)</span>}
                        </p>
                        <p className="text-xs text-text-muted">
                          Desde {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleInfo.color}`}>
                      <Shield className="w-3 h-3" />
                      {roleInfo.label}
                    </span>
                  </td>

                  {/* Teléfono */}
                  <td className="py-3 px-4 text-text-secondary hidden md:table-cell">
                    {profile.phone_number || <span className="text-text-muted/50">—</span>}
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-4">
                    {profile.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block"></span>
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-border-strong inline-block"></span>
                        Inactivo
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-4">
                    {isCurrentUser ? (
                      <span className="text-xs text-text-muted">—</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {/* Editar */}
                        <button
                          onClick={() => setEditUser(profile)}
                          disabled={loading}
                          title="Editar usuario"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Activar / Desactivar */}
                        <button
                          onClick={() => handleToggle(profile.id, profile.is_active)}
                          disabled={loading}
                          title={profile.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            profile.is_active
                              ? 'text-text-muted hover:text-warning-text hover:bg-warning-bg'
                              : 'text-text-muted hover:text-success-text hover:bg-success-bg'
                          }`}
                        >
                          {loading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : profile.is_active
                              ? <UserX className="w-3.5 h-3.5" />
                              : <UserCheck className="w-3.5 h-3.5" />
                          }
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => handleDelete(profile.id, profile.full_name)}
                          disabled={loading}
                          title="Eliminar usuario permanentemente"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {profiles.length === 0 && (
          <div className="py-16 text-center text-text-muted text-sm">
            No hay usuarios registrados.
          </div>
        )}
      </div>
    </>
  )
}
