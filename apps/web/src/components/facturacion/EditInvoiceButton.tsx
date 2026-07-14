'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { EditInvoiceModal } from './EditInvoiceModal'

interface InvoiceData {
  id: string; client_name: string; client_rif: string | null; project_id: string | null
  currency: string; tax_pct: number; due_at: string | null; notes: string | null; status: string
  invoice_items?: { id: string; description: string; quantity: number; unit_price: number }[]
}
interface EditInvoiceButtonProps {
  invoice:  InvoiceData
  projects: { id: string; name: string }[]
}

export function EditInvoiceButton({ invoice, projects }: EditInvoiceButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Editar factura"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-warning-text hover:bg-warning-bg transition-colors"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      {open && (
        <EditInvoiceModal
          open={open}
          onClose={() => setOpen(false)}
          invoice={invoice}
          projects={projects}
        />
      )}
    </>
  )
}
