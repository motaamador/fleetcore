'use client'

import { useTransition, useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchInput({ placeholder = "Buscar..." }: { placeholder?: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  
  const [value, setValue] = useState(searchParams.get('query') || '')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
          params.set('query', value)
        } else {
          params.delete('query')
        }
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [value, pathname, router, searchParams])

  return (
    <div className="relative w-full sm:w-96">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isPending ? 'text-primary animate-pulse' : 'text-text-muted'}`} />
      <input
        type="text"
        placeholder={placeholder}
        className="input pl-9"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}
