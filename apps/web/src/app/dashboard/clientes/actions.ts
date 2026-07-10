'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClientAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

export async function updateClientAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

export async function deleteClientAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/clientes')
  return { success: true }
}
