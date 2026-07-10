import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import { PrintButton } from '@/components/ui/PrintButton'

export const metadata: Metadata = { title: 'Recibo de Nómina | FleetCore' }

export default async function PayrollPrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: record } = await supabase
    .from('payroll_records')
    .select(`
      *,
      profiles!payroll_records_profile_id_fkey(full_name, role)
    `)
    .eq('id', params.id)
    .single()

  if (!record) return notFound()

  const currencySymbol = record.currency === 'USD' ? '$' : record.currency === 'EUR' ? '€' : 'Bs.'

  return (
    <div className="max-w-3xl mx-auto py-8 print:py-0 print:max-w-full">
      {/* ── Botonera Flotante (Solo pantalla) ── */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href="/dashboard/nominas" className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <PrintButton />
      </div>

      {/* ── Documento Recibo (Hoja Blanca) ── */}
      <div className="bg-white text-black p-10 md:p-14 rounded-xl shadow-xl border border-gray-200 print:shadow-none print:border-none print:p-0">
        
        {/* Cabecera */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">FleetCore<span className="text-primary">.</span></h1>
            <p className="text-sm text-gray-500 mt-1">Logística y Construcción C.A.</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">Recibo de Pago</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">Nº {record.id.split('-')[0].toUpperCase()}</p>
          </div>
        </div>

        {/* Datos del Empleado y Período */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-8 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Empleado</p>
            <p className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              {record.profiles?.full_name}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{record.profiles?.role}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Período de Nómina</p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(record.period_start).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} <span className="text-gray-400 mx-1">al</span> {new Date(record.period_end).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            {record.payment_date && (
              <p className="text-xs text-gray-500 mt-1">
                Pagado el: {new Date(record.payment_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Tabla de Conceptos */}
        <table className="w-full text-left mb-12 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-2 text-xs font-bold text-gray-500 uppercase">Concepto</th>
              <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right w-32">Asignaciones</th>
              <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right w-32">Deducciones</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-4 text-sm text-gray-800 font-medium">Salario Base</td>
              <td className="py-4 text-sm text-gray-700 text-right">{currencySymbol} {Number(record.base_salary).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              <td className="py-4 text-sm text-gray-400 text-right">—</td>
            </tr>
            {(record.bonuses > 0) && (
              <tr className="border-b border-gray-100">
                <td className="py-4 text-sm text-gray-800">Bonificaciones y Extras</td>
                <td className="py-4 text-sm text-gray-700 text-right">{currencySymbol} {Number(record.bonuses).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td className="py-4 text-sm text-gray-400 text-right">—</td>
              </tr>
            )}
            {(record.deductions > 0) && (
              <tr className="border-b border-gray-100">
                <td className="py-4 text-sm text-gray-800">Deducciones (Préstamos, Faltas)</td>
                <td className="py-4 text-sm text-gray-400 text-right">—</td>
                <td className="py-4 text-sm text-red-600 text-right">-{currencySymbol} {Number(record.deductions).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Total Neto */}
        <div className="flex justify-end mb-16">
          <div className="w-64">
            <div className="flex justify-between text-xl font-black text-gray-900 bg-gray-100 p-4 rounded-lg">
              <span>NETO A PAGAR</span>
              <span>{currencySymbol} {Number(record.net_pay).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-16 mt-24">
          <div className="text-center">
            <div className="border-t border-gray-400 mx-8 pt-2">
              <p className="text-sm font-bold text-gray-800">Firma Autorizada</p>
              <p className="text-xs text-gray-500">FleetCore C.A.</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 mx-8 pt-2">
              <p className="text-sm font-bold text-gray-800">Firma del Empleado</p>
              <p className="text-xs text-gray-500">Recibí Conforme</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
