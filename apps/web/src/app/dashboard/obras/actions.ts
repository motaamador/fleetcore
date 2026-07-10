'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createObra(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('projects').insert(data)
  
  if (error) {
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/obras')
  return { success: true }
}

export async function updateObra(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('projects').update(data).eq('id', id)
  
  if (error) {
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/obras')
  return { success: true }
}

export async function deleteObra(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  
  if (error) {
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/obras')
  return { success: true }
}

export async function updateObraStatusAction(id: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase.from('projects').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/obras')
  return { success: true }
}
