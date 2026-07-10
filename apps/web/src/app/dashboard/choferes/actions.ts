'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createChofer(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').insert({
    ...data,
    role: 'driver'
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/choferes')
  return { success: true }
}

export async function updateChofer(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/choferes')
  return { success: true }
}

export async function deleteChofer(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/choferes')
  return { success: true }
}

export async function updateChoferStatusAction(id: string, is_active: boolean) {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/choferes')
  return { success: true }
}
