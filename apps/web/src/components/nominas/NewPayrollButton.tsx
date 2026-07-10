'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign } from 'lucide-react'
import { NewPayrollModal } from './NewPayrollModal'

interface Profile { id: string; full_name: string; role: string; cedula_identidad?: string }

export function NewPayrollButton({ employees }: { employees: Profile[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        Registrar Pago
      </button>

      <NewPayrollModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        employees={employees}
      />
    </>
  )
}
