'use client'

import { Bell, Search, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { MobileMenu } from './MobileMenu'

const routeLabels: Record<string, string> = {
  '/dashboard':                'Dashboard',
  '/dashboard/camiones':       'Camiones',
  '/dashboard/fletes':         'Fletes',
  '/dashboard/choferes':       'Choferes',
  '/dashboard/inventario':     'Inventario',
  '/dashboard/clientes':       'Clientes',
  '/dashboard/facturacion':    'Facturación',
  '/dashboard/nominas':        'Nóminas',
  '/dashboard/contratos':      'Contratos',
  '/dashboard/mantenimiento':  'Mantenimiento',
  '/dashboard/combustible':    'Combustible',
  '/dashboard/reportes':       'Reportes',
}

export function Header() {
  const pathname = usePathname()
  const currentLabel = routeLabels[pathname] ?? 'Dashboard'

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      {/* Izquierda: Menu Movil + Breadcrumb */}
      <div className="flex items-center">
        <MobileMenu />
        <div className="flex items-center gap-1.5 sm:gap-2 text-sm">
          <span className="text-text-muted hidden sm:inline">FleetCore</span>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted hidden sm:inline" />
          <span className="font-medium text-text-primary capitalize">{currentLabel}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-9 pr-4 py-1.5 text-sm bg-background border border-border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500
                       w-56 placeholder:text-text-muted"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg bg-background border border-border
                           flex items-center justify-center hover:bg-border transition-colors">
          <Bell className="w-4 h-4 text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center cursor-pointer">
          <span className="text-xs font-semibold text-white">AD</span>
        </div>
      </div>
    </header>
  )
}
