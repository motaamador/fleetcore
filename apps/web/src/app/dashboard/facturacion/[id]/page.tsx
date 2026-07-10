import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
import { PrintButton } from '@/components/ui/PrintButton'

export const metadata: Metadata = { title: 'Factura Comercial | FleetCore' }

export default async function InvoicePrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      projects(name, location),
      invoice_items(*)
    `)
    .eq('id', params.id)
    .single()

  if (!invoice) return notFound()

  const currencySymbol = invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : 'Bs.'

  return (
    <div className="max-w-4xl mx-auto py-8 print:py-0 print:max-w-full">
      {/* ── Botonera Flotante (Solo pantalla) ── */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href="/dashboard/facturacion" className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <PrintButton />
      </div>

      {/* ── Documento Factura (Hoja Blanca) ── */}
      <div className="bg-white text-black p-10 md:p-16 rounded-xl shadow-xl border border-gray-200 print:shadow-none print:border-none print:p-0">
        
        {/* Cabecera */}
        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">FleetCore<span className="text-primary">.</span></h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Logística y Construcción C.A.</p>
            <p className="text-sm text-gray-500">RIF: J-00000000-0</p>
            <p className="text-sm text-gray-500">Valencia, Edo. Carabobo</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-light text-gray-400 uppercase tracking-widest mb-2">Factura</h2>
            <p className="text-lg font-bold text-gray-800">{invoice.invoice_num}</p>
            <p className="text-sm text-gray-500 mt-1">
              Emisión: {new Date(invoice.issued_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            {invoice.due_at && (
              <p className="text-sm text-gray-500">
                Vence: {new Date(invoice.due_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Cliente y Detalles */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Facturar A</p>
            <p className="text-base font-bold text-gray-800 capitalize">{invoice.client_name}</p>
            {invoice.client_rif && <p className="text-sm text-gray-600 mt-1">RIF: {invoice.client_rif}</p>}
          </div>
          <div>
            {invoice.projects && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Proyecto / Obra</p>
                <p className="text-base font-medium text-gray-800 flex items-center gap-2 capitalize">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {invoice.projects.name}
                </p>
                {invoice.projects.location && <p className="text-sm text-gray-600 mt-1 capitalize">{invoice.projects.location}</p>}
              </>
            )}
          </div>
        </div>

        {/* Tabla de Items */}
        <table className="w-full text-left mb-12">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-3 text-xs font-bold text-gray-800 uppercase">Descripción</th>
              <th className="py-3 text-xs font-bold text-gray-800 uppercase text-center w-24">Cant.</th>
              <th className="py-3 text-xs font-bold text-gray-800 uppercase text-right w-32">Precio Unit.</th>
              <th className="py-3 text-xs font-bold text-gray-800 uppercase text-right w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.invoice_items || []).map((item: any) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-4 text-sm text-gray-700 capitalize">{item.description}</td>
                <td className="py-4 text-sm text-gray-700 text-center">{item.quantity}</td>
                <td className="py-4 text-sm text-gray-700 text-right">{currencySymbol} {Number(item.unit_price).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td className="py-4 text-sm text-gray-900 font-medium text-right">{currencySymbol} {Number(item.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{currencySymbol} {Number(invoice.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA ({invoice.tax_pct}%)</span>
              <span>{currencySymbol} {Number(invoice.tax_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-gray-900 border-t-2 border-gray-800 pt-3">
              <span>TOTAL</span>
              <span>{currencySymbol} {Number(invoice.total).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 font-medium">Gracias por confiar en FleetCore.</p>
          <p className="text-xs text-gray-400 mt-1">Este documento es una representación impresa de la factura comercial.</p>
        </div>
      </div>
    </div>
  )
}
