'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, Building2, Loader2, Mail, Phone, MapPin, FileText } from 'lucide-react'
import { updateClientAction } from '@/app/dashboard/clientes/actions'

interface EditClientModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  client: any
}

interface FormData {
  name: string
  rif: string
  address: string
  contact_person: string
  email: string
  phone: string
}

const INITIAL_FORM: FormData = {
  name: '', rif: '', address: '', contact_person: '', email: '', phone: ''
}

export function EditClientModal({ open, onClose, onSuccess, client }: EditClientModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && client) {
      setForm({
        name: client.name || '',
        rif: client.rif || '',
        address: client.address || '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || ''
      })
    }
  }, [open, client])

  if (!open) return null

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const e: Partial<FormData> = {}
    if (!form.name.trim()) e.name = 'El nombre o razón social es requerido'
    if (!form.rif.trim()) e.rif = 'El RIF o documento es requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      try {
        await updateClientAction(client.id, {
          name: form.name.trim(),
          rif: form.rif.trim(),
          address: form.address.trim() || null,
          contact_person: form.contact_person.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
        })
        setForm(INITIAL_FORM)
        onSuccess()
        onClose()
      } catch (err: any) {
        setErrors({ name: `Error: ${err.message}` })
      }
    })
  }

  function handleClose() {
    setForm(INITIAL_FORM)
    setErrors({})
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClose} />

      <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Editar Cliente</h2>
              <p className="text-xs text-text-muted">Registra una nueva empresa o cliente directo</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-background-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="editar-cliente-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="label">Razón Social / Nombre <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`input ${errors.name ? 'border-danger' : ''}`}
              placeholder="Ej: Constructora ABC C.A."
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="label"><FileText className="w-3.5 h-3.5" /> RIF / Documento Identidad <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`input ${errors.rif ? 'border-danger' : ''}`}
              placeholder="Ej: J-12345678-9"
              value={form.rif}
              onChange={e => set('rif', e.target.value)}
            />
            {errors.rif && <p className="text-xs text-danger mt-1">{errors.rif}</p>}
          </div>

          <div>
            <label className="label"><MapPin className="w-3.5 h-3.5" /> Dirección Fiscal</label>
            <textarea
              rows={2}
              className="input resize-none"
              placeholder="Dirección completa de la empresa..."
              value={form.address}
              onChange={e => set('address', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Persona de Contacto</label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Ing. Carlos Méndez"
              value={form.contact_person}
              onChange={e => set('contact_person', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label"><Phone className="w-3.5 h-3.5" /> Teléfono</label>
              <input
                type="text"
                className="input"
                placeholder="+58 414 000 0000"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label"><Mail className="w-3.5 h-3.5" /> Correo Electrónico</label>
              <input
                type="email"
                className="input"
                placeholder="contacto@empresa.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">
            Cancelar
          </button>
          <button form="editar-cliente-form" type="submit" disabled={isPending} className="btn-primary flex items-center gap-2 min-w-[120px] justify-center">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Building2 className="w-4 h-4" /> Guardar Cambios</>}
          </button>
        </div>
      </aside>
    </>
  )
}
