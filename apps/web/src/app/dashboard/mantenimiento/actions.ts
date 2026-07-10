'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMaintenanceAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('maintenance_records').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/mantenimiento')
  return { success: true }
}

export async function updateMaintenanceAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('maintenance_records').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/mantenimiento')
  return { success: true }
}

export async function deleteMaintenanceAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('maintenance_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/mantenimiento')
  return { success: true }
}

export async function updateMaintenanceStatusAction(id: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase.from('maintenance_records').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/mantenimiento')
  return { success: true }
}
