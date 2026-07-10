'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPayrollAction(data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('payroll_records').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/nominas')
  return { success: true }
}

export async function updatePayrollAction(id: string, data: any) {
  const supabase = createClient()
  const { error } = await supabase.from('payroll_records').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/nominas')
  return { success: true }
}

export async function deletePayrollAction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('payroll_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/nominas')
  return { success: true }
}

export async function updatePayrollStatusAction(id: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase.from('payroll_records').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/nominas')
  return { success: true }
}
