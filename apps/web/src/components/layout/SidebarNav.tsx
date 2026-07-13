'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Truck, MapPin, Package, Users,
  Building2, FileText, DollarSign, Wrench, Fuel,
  ScrollText, BarChart3, ChevronRight, HardHat, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── navSections vive aquí (Client Component) para evitar pasar
// ── funciones/íconos como props desde un Server Component
const navSections = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { href: '/dashboard/choferes',    label: 'Choferes',   icon: Users },
      { href: '/dashboard/obras',       label: 'Obras',      icon: HardHat },
      { href: '/dashboard/camiones',    label: 'Camiones',   icon: Truck },
      { href: '/dashboard/fletes',      label: 'Fletes',     icon: MapPin },
      { href: '/dashboard/inventario',  label: 'Inventario', icon: Package },
    ],
  },
  {
    title: 'Administración',
    items: [
      { href: '/dashboard/clientes',    label: 'Clientes',    icon: Building2 },
      { href: '/dashboard/facturacion', label: 'Facturación', icon: FileText },
      { href: '/dashboard/nominas',     label: 'Nóminas',     icon: DollarSign },
      { href: '/dashboard/contratos',     label: 'Contratos',      icon: ScrollText },
      { href: '/dashboard/configuracion', label: 'Configuración',  icon: Settings },
    ],
  },
  {
    title: 'Flota y Control',
    items: [
      { href: '/dashboard/mantenimiento', label: 'Mantenimiento', icon: Wrench },
      { href: '/dashboard/combustible',   label: 'Combustible',   icon: Fuel },
      { href: '/dashboard/reportes',      label: 'Reportes',      icon: BarChart3 },
    ],
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3">
      {navSections.map((section) => (
        <div key={section.title} className="mb-2">
          <p className="section-title">{section.title}</p>
          <ul className="space-y-0.5">
            {section.items.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href)

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      isActive ? 'sidebar-link-active' : 'sidebar-link'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
