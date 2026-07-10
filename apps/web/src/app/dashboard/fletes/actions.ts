'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTripAction(data: any, stops: any[]) {
  const supabase = createClient()
  const { data: tripData, error: tripError } = await supabase.from('trips').insert(data).select('id').single()
  if (tripError) throw new Error(tripError.message)
  
  if (stops && stops.length > 0) {
    const stopsToInsert = stops.map((stop, idx) => ({
      trip_id: tripData.id,
      stop_order: idx + 1,
      location: stop.location,
      stop_type: stop.stop_type,
      notes: stop.notes
    }))
    const { error: stopsError } = await supabase.from('trip_stops').insert(stopsToInsert)
    if (stopsError) throw new Error(stopsError.message)
  }
  
  revalidatePath('/dashboard/fletes')
  return { success: true }
}

export async function deleteTripAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/fletes')
  return { success: true }
}

export async function updateTripStatusAction(id: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase.from('trips').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/fletes')
  return { success: true }
}
