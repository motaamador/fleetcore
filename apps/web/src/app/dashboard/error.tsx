'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log para monitoring (en producción iría a Sentry, etc.)
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-danger-bg flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-danger" />
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Algo salió mal
      </h2>
      <p className="text-sm text-text-secondary mb-1 max-w-sm">
        Se produjo un error al cargar esta sección. Por favor intenta nuevamente.
      </p>
      {error.digest && (
        <p className="text-xs text-text-muted mb-6 font-mono bg-background px-3 py-1 rounded">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  )
}
