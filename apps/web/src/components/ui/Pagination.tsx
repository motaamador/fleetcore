/**
 * Pagination.tsx
 * Componente de paginación reutilizable basado en URL searchParams.
 * No necesita estado cliente — funciona con Server Components.
 */
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages:  number
  totalItems:  number
  pageSize:    number
  /** Base URL del path actual, ej. '/dashboard/camiones' */
  basePath:    string
  /** searchParams existentes para preservar (ej. query, tab) */
  existingParams?: Record<string, string>
}

function buildUrl(
  basePath: string,
  page: number,
  existingParams: Record<string, string> = {}
): string {
  const params = new URLSearchParams({ ...existingParams, page: String(page) })
  return `${basePath}?${params.toString()}`
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  basePath,
  existingParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to   = Math.min(currentPage * pageSize, totalItems)

  // Generar rango de páginas a mostrar (máx 5 botones)
  const getPageRange = () => {
    const delta = 2
    const range: (number | '...')[] = []
    const left  = Math.max(2, currentPage - delta)
    const right = Math.min(totalPages - 1, currentPage + delta)

    range.push(1)
    if (left > 2) range.push('...')
    for (let i = left; i <= right; i++) range.push(i)
    if (right < totalPages - 1) range.push('...')
    if (totalPages > 1) range.push(totalPages)

    return range
  }

  const pages = getPageRange()

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface">
      {/* Info */}
      <p className="text-xs text-text-muted hidden sm:block">
        Mostrando <span className="font-semibold text-text-secondary">{from}–{to}</span> de{' '}
        <span className="font-semibold text-text-secondary">{totalItems}</span> registros
      </p>

      {/* Controles */}
      <nav className="flex items-center gap-1">
        {/* Primera */}
        {currentPage > 1 ? (
          <Link
            href={buildUrl(basePath, 1, existingParams)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-text-primary transition-colors"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Link>
        ) : (
          <span className="w-8 h-8 flex items-center justify-center rounded-lg text-border-strong cursor-not-allowed">
            <ChevronsLeft className="w-4 h-4" />
          </span>
        )}

        {/* Anterior */}
        {currentPage > 1 ? (
          <Link
            href={buildUrl(basePath, currentPage - 1, existingParams)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-text-primary transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        ) : (
          <span className="w-8 h-8 flex items-center justify-center rounded-lg text-border-strong cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </span>
        )}

        {/* Números de página */}
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-text-muted">
              …
            </span>
          ) : (
            <Link
              key={page}
              href={buildUrl(basePath, page as number, existingParams)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary text-gray-900 shadow-sm'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              }`}
            >
              {page}
            </Link>
          )
        )}

        {/* Siguiente */}
        {currentPage < totalPages ? (
          <Link
            href={buildUrl(basePath, currentPage + 1, existingParams)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-text-primary transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="w-8 h-8 flex items-center justify-center rounded-lg text-border-strong cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </span>
        )}

        {/* Última */}
        {currentPage < totalPages ? (
          <Link
            href={buildUrl(basePath, totalPages, existingParams)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-text-primary transition-colors"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="w-8 h-8 flex items-center justify-center rounded-lg text-border-strong cursor-not-allowed">
            <ChevronsRight className="w-4 h-4" />
          </span>
        )}
      </nav>

      {/* Contador mobile */}
      <p className="text-xs text-text-muted sm:hidden">
        {currentPage}/{totalPages}
      </p>
    </div>
  )
}
