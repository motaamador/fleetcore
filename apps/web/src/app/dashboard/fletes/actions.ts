'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import {
  TripCreateSchema,
  TripStopSchema,
  TripStatusSchema,
} from '@/lib/schemas'
import { z } from 'zod'

const ALLOWED_WRITE = ['admin', 'dispatcher'] as const
const PATH = '/dashboard/fletes'

export async function createTripAction(data: unknown, stops: unknown[]) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = TripCreateSchema.parse(data)

    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert(parsed)
      .select('id')
      .single()

    if (tripError) throw new Error(tripError.message)

    if (stops && stops.length > 0) {
      const validStops = z.array(TripStopSchema).parse(stops)
      const stopsToInsert = validStops.map((stop, idx) => ({
        trip_id:   tripData.id,
        stop_order: idx + 1,
        location:  stop.location,
        stop_type: stop.stop_type,
        notes:     stop.notes,
      }))
      const { error: stopsError } = await supabase.from('trip_stops').insert(stopsToInsert)
      if (stopsError) throw new Error(stopsError.message)
    }

    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateTripAction(id: string, data: unknown, stops: unknown[]) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = TripCreateSchema.partial().parse(data)

    const { error: tripError } = await supabase
      .from('trips')
      .update(parsed)
      .eq('id', id)

    if (tripError) throw new Error(tripError.message)

    // Reemplazar paradas: eliminar las existentes e insertar las nuevas
    await supabase.from('trip_stops').delete().eq('trip_id', id)

    if (stops && stops.length > 0) {
      const validStops = z.array(TripStopSchema).parse(stops)
      const stopsToInsert = validStops.map((stop, idx) => ({
        trip_id:    id,
        stop_order: idx + 1,
        location:   stop.location,
        stop_type:  stop.stop_type,
        notes:      stop.notes,
      }))
      const { error: stopsError } = await supabase.from('trip_stops').insert(stopsToInsert)
      if (stopsError) throw new Error(stopsError.message)
    }

    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deleteTripAction(id: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateTripStatusAction(id: string, status: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { status: validStatus } = TripStatusSchema.parse({ status })
    const { error } = await supabase.from('trips').update({ status: validStatus }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

// ── Genera una factura borrador a partir de un flete completado ───────────────
export async function generateInvoiceFromTripAction(tripId: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])

    // Obtener el flete con su proyecto y datos financieros
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*, projects(name, client_id, client_name)')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) throw new Error('Flete no encontrado')
    if (!trip.precio_flete) throw new Error('El flete no tiene un precio registrado. Agrega el precio en "Costos del Viaje" primero.')

    // Construir la factura borrador
    const invoiceData = {
      client_name:  trip.projects?.client_name || trip.projects?.name || 'Cliente Desconocido',
      client_rif:   null,
      project_id:   trip.project_id || null,
      subtotal:     trip.precio_flete,
      tax_pct:      0,
      currency:     trip.precio_currency || 'USD',
      status:       'borrador',
      issued_at:    new Date().toISOString().split('T')[0],
      notes:        `Flete: ${trip.origin} → ${trip.destination}`,
    }

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select('id')
      .single()

    if (invError) throw new Error(invError.message)

    revalidatePath(PATH)
    revalidatePath('/dashboard/facturacion')
    return { success: true, invoiceId: invoice.id }
  } catch (e) {
    return handleActionError(e)
  }
}

// ── Obtiene los bonos de viajes completados de un chofer en un período ────────
export async function getTripBonusesByDriverAction(
  driverId: string,
  periodStart: string,
  periodEnd: string
) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE, 'finance'])

    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, origin, destination, bono_chofer, bono_currency, departure_time')
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .gte('departure_time', `${periodStart}T00:00:00Z`)
      .lte('departure_time', `${periodEnd}T23:59:59Z`)
      .not('bono_chofer', 'is', null)
      .gt('bono_chofer', 0)

    if (error) throw new Error(error.message)

    // Agrupar por moneda
    const byUSD = (trips || []).filter(t => (t.bono_currency || 'USD') === 'USD')
    const byVES = (trips || []).filter(t => t.bono_currency === 'VES')

    const totalUSD = byUSD.reduce((s, t) => s + (t.bono_chofer || 0), 0)
    const totalVES = byVES.reduce((s, t) => s + (t.bono_chofer || 0), 0)

    return {
      success: true,
      trips: trips || [],
      totalUSD,
      totalVES,
      count: (trips || []).length,
    }
  } catch (e) {
    return handleActionError(e)
  }
}

