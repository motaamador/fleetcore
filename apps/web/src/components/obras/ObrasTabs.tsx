'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function ObrasTabs() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'activas'

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }

  return (
    <div className="border-b border-border mb-6 mt-4">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        <Link
          href={`?${createQueryString('tab', 'activas')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'activas'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Obras Activas
        </Link>
        
        <Link
          href={`?${createQueryString('tab', 'inactivas')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'inactivas'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Completadas / En Pausa
        </Link>
        
        <Link
          href={`?${createQueryString('tab', 'todas')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'todas'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Todas
        </Link>
      </nav>
    </div>
  )
}
