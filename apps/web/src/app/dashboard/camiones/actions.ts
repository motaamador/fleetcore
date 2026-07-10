'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCamion(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('vehicles').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/camiones')
  return { success: true }
}

export async function updateCamion(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('vehicles').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/camiones')
  return { success: true }
}

export async function deleteCamion(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/camiones')
  return { success: true }
}

export async function updateCamionStatusAction(id: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase.from('vehicles').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/camiones')
  return { success: true }
}
