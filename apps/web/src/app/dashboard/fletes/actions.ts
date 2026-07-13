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
