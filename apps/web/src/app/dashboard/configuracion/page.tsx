import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Settings, Users, Shield, Activity,
  UserCheck, UserX, Key,
} from 'lucide-react'
import { InviteUserModal } from '@/components/configuracion/InviteUserModal'
import { UsersTable } from '@/components/configuracion/UsersTable'

export const metadata: Metadata = { title: 'Configuración | FleetCore' }
export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administradores',
  dispatcher: 'Despachadores',
  finance:    'Finanzas',
  driver:     'Choferes',
}

export default async function ConfiguracionPage() {
  const supabase = createClient()

  // Solo admins pueden acceder
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Cargar todos los perfiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone_number, is_active, created_at')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })

  const safeProfiles = profiles ?? []

  // Stats
  const totalActive   = safeProfiles.filter(p => p.is_active).length
  const totalInactive = safeProfiles.filter(p => !p.is_active).length
  const byRole = Object.entries(
    safeProfiles.reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] ?? 0) + 1
      return acc
    }, {})
  ).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Gestiona los usuarios y permisos del sistema</p>
        </div>
        <InviteUserModal />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-primary-50">
            <Users className="w-5 h-5 text-primary-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total Usuarios</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{safeProfiles.length}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg">
            <UserCheck className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Activos</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{totalActive}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-warning-bg">
            <UserX className="w-5 h-5 text-warning-text" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Inactivos</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{totalInactive}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-info-bg">
            <Shield className="w-5 h-5 text-info-text" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Admins</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">
              {safeProfiles.filter(p => p.role === 'admin').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Distribución por Rol */}
        <div className="card">
          <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Por Rol
          </h3>
          <div className="space-y-3">
            {byRole.map(([role, count]) => {
              const pct = safeProfiles.length > 0 ? (count / safeProfiles.length) * 100 : 0
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{ROLE_LABELS[role] ?? role}</span>
                    <span className="font-semibold text-text-primary">{count}</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-light transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {byRole.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">Sin usuarios</p>
            )}
          </div>

          {/* Info de Roles */}
          <div className="mt-6 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Permisos por rol</p>
            {[
              { role: 'admin',      desc: 'Acceso total', color: 'bg-primary/10 text-primary-700' },
              { role: 'dispatcher', desc: 'Ops + Flota',   color: 'bg-info-bg text-info-text' },
              { role: 'finance',    desc: 'Finanzas',      color: 'bg-success-bg text-success-text' },
              { role: 'driver',     desc: 'Solo sus fletes', color: 'bg-warning-bg text-warning-text' },
            ].map(item => (
              <div key={item.role} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.color}`}>
                  {ROLE_LABELS[item.role]}
                </span>
                <span className="text-xs text-text-muted">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="card xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Usuarios del Sistema
            </h3>
            <span className="text-xs text-text-muted">{safeProfiles.length} usuario{safeProfiles.length !== 1 ? 's' : ''}</span>
          </div>
          <UsersTable profiles={safeProfiles} currentUserId={user.id} />
        </div>
      </div>

    </div>
  )
}
