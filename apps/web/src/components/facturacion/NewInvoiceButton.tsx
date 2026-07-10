'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { NewInvoiceModal } from './NewInvoiceModal'

interface Project { id: string; name: string }

export function NewInvoiceButton({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Nueva Factura
      </button>

      <NewInvoiceModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        projects={projects}
      />
    </>
  )
}
