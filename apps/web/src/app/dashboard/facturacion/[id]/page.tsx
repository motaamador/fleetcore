import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PrintButton } from '@/components/ui/PrintButton'

export const metadata: Metadata = { title: 'Factura Comercial | FleetCore' }

export default async function InvoicePrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Carga en paralelo: la factura y los datos de empresa
  const [
    { data: invoice },
    { data: company },
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, projects(name, location), invoice_items(*)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('company_settings')
      .select('name, legal_name, rif, address, city, phone, email, logo_url, invoice_footer')
      .eq('id', 1)
      .single(),
  ])

  if (!invoice) return notFound()

  const currencySymbol = invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : 'Bs.'

  // Fallback si la tabla aún no existe
  const co = company ?? {
    name: 'FleetCore', legal_name: 'Logística y Construcción C.A.',
    rif: 'J-00000000-0', address: 'Valencia, Edo. Carabobo',
    city: null, phone: null, email: null, logo_url: null, invoice_footer: null,
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

  return (
    <div className="max-w-4xl mx-auto py-8 print:py-0 print:max-w-full">

      {/* ── Controles (solo pantalla) ── */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href="/dashboard/facturacion" className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver a Facturación
        </Link>
        <PrintButton />
      </div>

      {/* ── Hoja de Factura ── */}
      <div className="bg-white text-gray-900 p-10 md:p-16 rounded-xl shadow-xl border border-gray-200 print:shadow-none print:border-none print:rounded-none print:p-0">

        {/* Cabecera con datos de empresa */}
        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
          <div>
            {/* Logo si existe */}
            {co.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={co.logo_url} alt={co.name} className="h-14 w-auto mb-3 object-contain" />
            )}
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {co.name}<span className="text-primary">.</span>
            </h1>
            {co.legal_name && <p className="text-sm text-gray-500 mt-0.5 font-medium">{co.legal_name}</p>}
            {co.rif        && <p className="text-sm text-gray-500">RIF: {co.rif}</p>}
            {(co.address || co.city) && (
              <p className="text-sm text-gray-500">{[co.address, co.city].filter(Boolean).join(', ')}</p>
            )}
            {co.phone && <p className="text-sm text-gray-500">Tel: {co.phone}</p>}
            {co.email && <p className="text-sm text-gray-500">{co.email}</p>}
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-light text-gray-300 uppercase tracking-widest mb-2">Factura</h2>
            <p className="text-xl font-bold text-gray-800">{invoice.invoice_num}</p>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500">Emisión: <span className="font-medium text-gray-700">{formatDate(invoice.issued_at)}</span></p>
              {invoice.due_at && (
                <p className="text-sm text-gray-500">Vence: <span className="font-medium text-gray-700">{formatDate(invoice.due_at)}</span></p>
              )}
            </div>
            {/* Badge de estado */}
            <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              invoice.status === 'pagada'   ? 'bg-green-100 text-green-700' :
              invoice.status === 'emitida'  ? 'bg-blue-100 text-blue-700' :
              invoice.status === 'cancelada'? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Cliente y Obra */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Facturar A</p>
            <p className="text-base font-bold text-gray-800 capitalize">{invoice.client_name}</p>
            {invoice.client_rif && <p className="text-sm text-gray-600 mt-1">RIF: {invoice.client_rif}</p>}
          </div>
          {invoice.projects && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Proyecto / Obra</p>
              <p className="text-base font-medium text-gray-800 capitalize">{invoice.projects.name}</p>
              {invoice.projects.location && (
                <p className="text-sm text-gray-600 mt-1 capitalize">{invoice.projects.location}</p>
              )}
            </div>
          )}
        </div>

        {/* Tabla de Items */}
        <table className="w-full text-left mb-12">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="py-3 text-xs font-bold text-gray-800 uppercase">Descripción</th>
              <th className="py-3 text-xs font-bold text-gray-800 uppercase text-center w-20">Cant.</th>
              <th className="py-3 text-xs font-bold text-gray-800 uppercase text-right w-32">P. Unit.</th>
              <th className="py-3 text-xs font-bold text-gray-800 uppercase text-right w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.invoice_items || []).map((item: any) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 print:hover:bg-transparent">
                <td className="py-4 text-sm text-gray-700 capitalize">{item.description}</td>
                <td className="py-4 text-sm text-gray-700 text-center">{item.quantity}</td>
                <td className="py-4 text-sm text-gray-700 text-right">
                  {currencySymbol} {Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 text-sm font-medium text-gray-900 text-right">
                  {currencySymbol} {Number(item.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{currencySymbol} {Number(invoice.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA ({invoice.tax_pct}%)</span>
              <span>{currencySymbol} {Number(invoice.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-gray-900 border-t-2 border-gray-900 pt-3 mt-1">
              <span>TOTAL {invoice.currency}</span>
              <span>{currencySymbol} {Number(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {invoice.notes && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notas</p>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer personalizable */}
        <div className="mt-16 pt-6 border-t border-gray-200 text-center space-y-1">
          <p className="text-xs text-gray-400 font-medium">
            {co.invoice_footer ?? `Gracias por confiar en ${co.name}.`}
          </p>
          <p className="text-xs text-gray-300">
            {co.name} {co.rif ? `· RIF: ${co.rif}` : ''} · Generado el {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>
    </div>
  )
}
