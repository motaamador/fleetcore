'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFuelAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('fuel_records').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/combustible')
  return { success: true }
}

export async function updateFuelAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('fuel_records').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/combustible')
  return { success: true }
}

export async function deleteFuelAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('fuel_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/combustible')
  return { success: true }
}
