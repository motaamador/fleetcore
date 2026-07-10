'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContractAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('contracts').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/contratos')
  return { success: true }
}

export async function updateContractAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('contracts').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/contratos')
  return { success: true }
}

export async function deleteContractAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/contratos')
  return { success: true }
}
