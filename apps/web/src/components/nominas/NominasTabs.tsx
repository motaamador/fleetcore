'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function NominasTabs() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'pendientes'

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }

  return (
    <div className="border-b border-border mb-6 mt-4">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        <Link
          href={`?${createQueryString('tab', 'pendientes')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'pendientes'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Por Pagar / Borrador
        </Link>
        
        <Link
          href={`?${createQueryString('tab', 'pagadas')}`}
          className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'pagadas'
              ? 'border-primary text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
          }`}
        >
          Pagadas (Historial)
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
