import Link from 'next/link'
import { Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav }   from './SidebarNav'
import { LogoutButton } from './LogoutButton'


// ── Sidebar es un Server Component para leer la sesión ────────────────────────
export async function Sidebar() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Cargar perfil del usuario si está autenticado
  let profile: { full_name: string; role: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // Iniciales para el avatar
  const displayName  = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const displayEmail = user?.email || ''
  const initials     = displayName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  const ROLE_LABELS: Record<string, string> = {
    admin:      'Administrador',
    dispatcher: 'Despachador',
    driver:     'Conductor',
    finance:    'Finanzas',
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar-bg border-r border-sidebar-border h-screen sticky top-0 hidden md:flex flex-col print:hidden">

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-gray-900" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Fleet<span className="text-primary">Core</span>
          </span>
        </div>
      </div>

      {/* Navigation — Client Component para usePathname */}
      <SidebarNav />

      {/* Footer — Usuario y Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 rounded-lg mb-1">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary-700">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
            <p className="text-xs text-text-muted truncate">
              {profile?.role ? ROLE_LABELS[profile.role] || profile.role : displayEmail}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

    </aside>
  )
}

