'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInventoryAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('inventory_items').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventario')
  return { success: true }
}

export async function updateInventoryAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('inventory_items').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventario')
  return { success: true }
}

export async function deleteInventoryAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventario')
  return { success: true }
}
