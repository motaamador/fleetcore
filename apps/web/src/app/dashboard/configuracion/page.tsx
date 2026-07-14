import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Settings, Users, Shield, Activity,
  UserCheck, UserX, Key, Building2,
  AlertTriangle, Database, Lock, RefreshCw,
} from 'lucide-react'
import { InviteUserModal } from '@/components/configuracion/InviteUserModal'
import { UsersTable } from '@/components/configuracion/UsersTable'
import { CompanySettingsForm } from '@/components/configuracion/CompanySettingsForm'
import { ConfigTabs } from '@/components/configuracion/ConfigTabs'

export const metadata: Metadata = { title: 'Configuración | FleetCore' }
export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administradores',
  dispatcher: 'Despachadores',
  finance:    'Finanzas',
  driver:     'Choferes',
}

// ── Fallback si la tabla company_settings aún no existe en BD ─────────────────
const COMPANY_DEFAULTS = {
  name:           'Mi Empresa C.A.',
  legal_name:     null,
  rif:            null,
  address:        null,
  city:           null,
  phone:          null,
  email:          null,
  website:        null,
  logo_url:       null,
  currency:       'USD',
  invoice_footer: null,
}

export default async function ConfiguracionPage() {
  const supabase = createClient()

  // Guard: solo admins
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') redirect('/dashboard')

  // Cargar datos en paralelo
  const [
    { data: profiles },
    { data: companyData },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, phone_number, is_active, created_at')
      .order('role').order('full_name'),
    supabase
      .from('company_settings')
      .select('*')
      .eq('id', 1)
      .single(),
  ])

  const safeProfiles = profiles ?? []
  const company      = companyData ?? COMPANY_DEFAULTS

  // Stats de usuarios
  const totalActive   = safeProfiles.filter(p => p.is_active).length
  const totalInactive = safeProfiles.filter(p => !p.is_active).length
  const byRole = Object.entries(
    safeProfiles.reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] ?? 0) + 1
      return acc
    }, {})
  ).sort(([, a], [, b]) => b - a)

  // ── Tab: Usuarios y Roles ──────────────────────────────────────────────────
  const usersContent = (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

      {/* Sidebar de distribución */}
      <div className="card">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Distribución
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
                  <div className="h-full rounded-full bg-primary-light transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {byRole.length === 0 && <p className="text-sm text-text-muted text-center py-4">Sin usuarios</p>}
        </div>

        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Permisos</p>
          {[
            { role: 'admin',      desc: 'Acceso total',     color: 'bg-primary/10 text-primary-700' },
            { role: 'dispatcher', desc: 'Ops + Flota',      color: 'bg-info-bg text-info-text' },
            { role: 'finance',    desc: 'Solo Finanzas',    color: 'bg-success-bg text-success-text' },
            { role: 'driver',     desc: 'Sus fletes',       color: 'bg-warning-bg text-warning-text' },
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

      {/* Tabla de usuarios */}
      <div className="card xl:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Usuarios del Sistema
          </h3>
          <span className="text-xs text-text-muted">{safeProfiles.length} usuario{safeProfiles.length !== 1 ? 's' : ''}</span>
        </div>
        <UsersTable profiles={safeProfiles} currentUserId={user.id} />
      </div>
    </div>
  )

  // ── Tab: Empresa ───────────────────────────────────────────────────────────
  const companyContent = (
    <div className="card max-w-3xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary-700" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Datos de la Empresa</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Esta información aparece en el membrete de todas las facturas generadas.
          </p>
        </div>
      </div>
      {!companyData && (
        <div className="mb-4 p-3 rounded-lg bg-warning-bg border border-warning/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-warning-text">
            La tabla <code className="font-mono bg-warning/10 px-1 rounded">company_settings</code> no existe aún en la base de datos.{' '}
            Ejecuta la migración <strong>20260714000011_company_settings.sql</strong> en el SQL Editor de Supabase primero.
          </p>
        </div>
      )}
      <CompanySettingsForm settings={company} />
    </div>
  )

  // ── Tab: Sistema ───────────────────────────────────────────────────────────
  const systemContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-info-bg flex items-center justify-center">
            <Database className="w-4 h-4 text-info-text" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Base de Datos</h3>
            <p className="text-xs text-text-muted">Supabase PostgreSQL</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Proveedor</span>
            <span className="font-medium text-text-primary">Supabase</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Región</span>
            <span className="font-medium text-text-primary">us-east-1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">RLS</span>
            <span className="font-medium text-success-text">Activo</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-success-bg flex items-center justify-center">
            <Lock className="w-4 h-4 text-success" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Seguridad</h3>
            <p className="text-xs text-text-muted">Autenticación y acceso</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Auth</span>
            <span className="font-medium text-text-primary">Supabase Auth</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Sesiones</span>
            <span className="font-medium text-text-primary">JWT + Cookie</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">RBAC</span>
            <span className="font-medium text-success-text">4 roles</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Validación</span>
            <span className="font-medium text-success-text">Zod en todas las Actions</span>
          </div>
        </div>
      </div>

      <div className="card md:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-warning-bg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-warning-text" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Versión del Sistema</h3>
            <p className="text-xs text-text-muted">Stack tecnológico actual</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { tech: 'Next.js', version: '14.2' },
            { tech: 'Supabase', version: 'v2' },
            { tech: 'TypeScript', version: '5.x' },
            { tech: 'Zod', version: '3.x' },
          ].map(t => (
            <div key={t.tech} className="bg-background rounded-xl p-3 text-center border border-border">
              <p className="text-xs font-semibold text-text-primary">{t.tech}</p>
              <p className="text-xs text-text-muted mt-0.5">v{t.version}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h1 className="page-title">Configuración</h1>
            <p className="page-subtitle">Gestiona usuarios, empresa y ajustes del sistema.</p>
          </div>
        </div>
        <InviteUserModal />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-icon bg-primary-50"><Users className="w-5 h-5 text-primary-700" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{safeProfiles.length}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-bg"><UserCheck className="w-5 h-5 text-success" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Activos</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{totalActive}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-warning-bg"><UserX className="w-5 h-5 text-warning-text" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Inactivos</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{totalInactive}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-info-bg"><Shield className="w-5 h-5 text-info-text" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Admins</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">
              {safeProfiles.filter(p => p.role === 'admin').length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <ConfigTabs
          usersContent={usersContent}
          companyContent={companyContent}
          systemContent={systemContent}
        />
      </div>

    </div>
  )
}
