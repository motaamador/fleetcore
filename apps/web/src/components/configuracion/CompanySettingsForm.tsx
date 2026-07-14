'use client'

import { useState, useTransition } from 'react'
import {
  Building2, Save, Loader2, CheckCircle2,
  AlertCircle, Globe, Phone, Mail, MapPin, DollarSign, FileText
} from 'lucide-react'
import { saveCompanySettingsAction } from '@/app/dashboard/configuracion/actions'

type CompanySettings = {
  name:           string
  legal_name:     string | null
  rif:            string | null
  address:        string | null
  city:           string | null
  phone:          string | null
  email:          string | null
  website:        string | null
  logo_url:       string | null
  currency:       string
  invoice_footer: string | null
}

export function CompanySettingsForm({ settings }: { settings: CompanySettings }) {
  const [isPending, startTx] = useTransition()
  const [status, setStatus]  = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [form, setForm]      = useState<CompanySettings>(settings)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setStatus(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    startTx(async () => {
      const result = await saveCompanySettingsAction(form)
      if (result.success) {
        setStatus({ type: 'success', message: 'message' in result ? (result.message ?? '¡Guardado!') : '¡Guardado!' })
      } else {
        setStatus({ type: 'error', message: 'error' in result ? result.error : 'Error al guardar.' })
      }
    })
  }

  const Field = ({
    label, name, type = 'text', placeholder, icon: Icon, required = false,
  }: {
    label: string; name: keyof CompanySettings; type?: string
    placeholder?: string; icon: any; required?: boolean
  }) => (
    <div>
      <label className="label">
        <Icon className="w-3.5 h-3.5" />
        {label} {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        type={type} name={name} required={required}
        value={(form[name] as string) ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Identidad */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Identidad de la Empresa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre Comercial" name="name" placeholder="FleetCore" icon={Building2} required />
          <Field label="Razón Social Completa" name="legal_name" placeholder="FleetCore Logística C.A." icon={Building2} />
          <Field label="RIF" name="rif" placeholder="J-12345678-9" icon={FileText} />
          <div>
            <label className="label">
              <DollarSign className="w-3.5 h-3.5" />
              Moneda Base
            </label>
            <select name="currency" value={form.currency} onChange={handleChange} className="input-field">
              <option value="USD">🇺🇸 USD — Dólar Americano</option>
              <option value="EUR">🇪🇺 EUR — Euro</option>
              <option value="VES">🇻🇪 VES — Bolívar Soberano</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Contacto */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          Contacto y Ubicación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Dirección" name="address" placeholder="Av. Principal, Zona Industrial" icon={MapPin} />
          <Field label="Ciudad / Estado" name="city" placeholder="Valencia, Edo. Carabobo" icon={MapPin} />
          <Field label="Teléfono" name="phone" type="tel" placeholder="+58 241 000 0000" icon={Phone} />
          <Field label="Email corporativo" name="email" type="email" placeholder="contacto@empresa.com" icon={Mail} />
          <div className="md:col-span-2">
            <Field label="Sitio Web" name="website" type="url" placeholder="https://www.empresa.com" icon={Globe} />
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Logo y Facturación */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Identidad Visual y Facturación
        </h3>
        <div className="space-y-4">
          <div>
            <label className="label">
              <Globe className="w-3.5 h-3.5" />
              URL del Logo
            </label>
            <input
              type="url" name="logo_url"
              value={form.logo_url ?? ''}
              onChange={handleChange}
              placeholder="https://miempresa.com/logo.png"
              className="input-field"
            />
            {form.logo_url && (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.logo_url}
                  alt="Logo preview"
                  className="h-12 w-auto max-w-[160px] object-contain border border-border rounded-lg p-1 bg-white"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <span className="text-xs text-text-muted">Vista previa del logo</span>
              </div>
            )}
          </div>

          <div>
            <label className="label">
              <FileText className="w-3.5 h-3.5" />
              Texto pie de página en Facturas
            </label>
            <textarea
              name="invoice_footer"
              value={form.invoice_footer ?? ''}
              onChange={e => { setForm(p => ({ ...p, invoice_footer: e.target.value })); setStatus(null) }}
              rows={3}
              placeholder="Gracias por su preferencia. Válido como comprobante fiscal."
              className="input-field resize-none"
            />
          </div>
        </div>
      </div>

      {/* Feedback */}
      {status && (
        <div className={`p-3 rounded-lg text-sm flex items-start gap-2 border ${
          status.type === 'success'
            ? 'bg-success-bg text-success-text border-success/20'
            : 'bg-danger-bg text-danger border-danger/20'
        }`}>
          {status.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          }
          {status.message}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex items-center gap-2 text-sm px-6"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Guardando…' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
