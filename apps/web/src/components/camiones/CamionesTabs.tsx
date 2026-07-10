'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function CamionesTabs() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'activos'

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }

  return (
    <div className="border-b border-border mb-6 mt-4">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        <Link
          href={`?${createQueryString('tab', 'activos')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'activos'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Disponibles / Activos
        </Link>
        
        <Link
          href={`?${createQueryString('tab', 'mantenimiento')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'mantenimiento'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          En Mantenimiento
        </Link>
        
        <Link
          href={`?${createQueryString('tab', 'todos')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'todos'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Todos
        </Link>
      </nav>
    </div>
  )
}
