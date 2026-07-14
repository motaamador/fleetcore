'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Calendar } from 'lucide-react'

export function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [from, setFrom] = useState(searchParams.get('from') || '')
  const [to, setTo]   = useState(searchParams.get('to') || '')

  const applyFilter = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (from) params.set('from', from)
    else params.delete('from')
    
    if (to) params.set('to', to)
    else params.delete('to')
    
    router.push(`?${params.toString()}`)
  }

  const clearFilter = () => {
    setFrom('')
    setTo('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('from')
    params.delete('to')
    router.push(`?${params.toString()}`)
  }

  return (
    <form onSubmit={applyFilter} className="flex flex-wrap items-center gap-2 print:hidden">
      <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden">
        <div className="pl-3 pr-1 py-1.5 text-text-muted">
          <Calendar className="w-4 h-4" />
        </div>
        <input 
          type="date" 
          value={from}
          onChange={e => setFrom(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm py-1.5 px-2 text-text-primary outline-none"
        />
        <span className="text-text-muted text-sm px-1">-</span>
        <input 
          type="date" 
          value={to}
          onChange={e => setTo(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm py-1.5 px-2 text-text-primary outline-none"
        />
      </div>
      <button type="submit" className="btn-primary py-1.5 px-3 text-sm h-full rounded-lg">Filtrar</button>
      {(searchParams.get('from') || searchParams.get('to')) && (
        <button type="button" onClick={clearFilter} className="btn-secondary py-1.5 px-3 text-sm h-full rounded-lg">Limpiar</button>
      )}
    </form>
  )
}
