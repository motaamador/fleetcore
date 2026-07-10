'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function FletesTabs() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'activos'
  const currentQuery = searchParams.get('query') || ''

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }

  return (
    <div className="border-b border-border mb-6">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        <Link
          href={`?${createQueryString('tab', 'activos')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'activos'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Fletes Activos
        </Link>
        
        <Link
          href={`?${createQueryString('tab', 'historial')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'historial'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Historial (Completados)
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
