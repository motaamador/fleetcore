import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Printer, MapPin, CalendarClock, Truck, CheckCircle2 } from 'lucide-react'
import type { Profile, Trip } from '@fleetcore/types'

export const metadata: Metadata = {
  title: 'Relación de Viajes | FleetCore',
}

export default async function ChoferReportePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // 1. Obtener datos del chofer
  const { data: driver, error: driverError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (driverError || !driver) {
    notFound()
  }

  // 2. Obtener fletes (viajes) completados del chofer
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select(`
      *,
      project:projects(name, client_name),
      vehicle:vehicles(plate_number, make, model)
    `)
    .eq('driver_id', params.id)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })

  const safeTrips = trips || []

  return (
    <div className="min-h-screen bg-background sm:p-8 font-sans">
      
      {/* Botón Flotante para Imprimir (Oculto en Impresión) */}
      <div className="fixed top-6 right-6 print:hidden z-50">
        <button
          onClick="window.print()"
          className="btn-primary shadow-xl shadow-primary/20 flex items-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Imprimir / PDF
        </button>
      </div>

      {/* Contenedor del Documento A4 */}
      <div className="max-w-[21cm] mx-auto bg-white sm:shadow-sm sm:border border-border print:shadow-none print:border-none p-8 sm:p-12 min-h-[29.7cm] text-slate-900">
        
        {/* Encabezado del Documento */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">FLEETCORE<span className="text-primary-600">.</span></h1>
            </div>
            <p className="text-sm text-slate-500 font-medium">División de Operaciones y Logística</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-light tracking-tight text-slate-800 uppercase mb-2">Relación de Viajes</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-sm font-medium text-slate-700">
              <CalendarClock className="w-4 h-4 text-slate-500" />
              Fecha de Emisión: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Datos del Conductor */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Información del Conductor</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Nombre Completo</p>
              <p className="font-semibold text-slate-900">{driver.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Cédula de Identidad</p>
              <p className="font-semibold text-slate-900 font-mono">{driver.cedula_identidad || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Teléfono</p>
              <p className="font-semibold text-slate-900">{driver.phone_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Tipo de Licencia</p>
              <p className="font-semibold text-slate-900">{driver.licencia_tipo ? `Grado ${driver.licencia_tipo}` : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Tabla de Viajes */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Detalle de Fletes Completados</h3>
          
          {safeTrips.length === 0 ? (
             <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
               No hay fletes completados registrados para este conductor.
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-3 px-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Fecha Completado</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Ruta (Origen → Destino)</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Vehículo</th>
                  <th className="py-3 px-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Proyecto / Cliente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeTrips.map((trip: any) => (
                  <tr key={trip.id} className="group">
                    <td className="py-4 px-2">
                      <span className="text-sm font-medium text-slate-900">
                        {trip.arrival_time ? new Date(trip.arrival_time).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : (trip.updated_at ? new Date(trip.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-medium">{trip.origin}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 pl-5">
                          <span className="text-xs">→</span> {trip.destination}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono font-medium">
                        <Truck className="w-3 h-3" />
                        {trip.vehicle?.plate_number || 'S/A'}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <p className="text-sm font-medium text-slate-900">{trip.project?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{trip.project?.client_name || '—'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Resumen Final */}
        <div className="border-t-2 border-slate-800 pt-6 flex justify-between items-end mt-12">
          <div className="text-slate-500 text-xs max-w-sm">
            Este documento constituye una relación oficial de los servicios de transporte prestados por el conductor mencionado y puede ser utilizado para fines de conciliación de nómina.
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Fletes Completados</p>
            <p className="text-4xl font-black text-slate-900 flex items-center justify-end gap-2">
              {safeTrips.length}
              <CheckCircle2 className="w-6 h-6 text-success" />
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
