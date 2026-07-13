'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import {
  PayrollCreateSchema,
  PayrollUpdateSchema,
  PayrollStatusSchema,
} from '@/lib/schemas'

const ALLOWED_WRITE = ['admin', 'finance'] as const
const PATH = '/dashboard/nominas'

export async function createPayrollAction(data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = PayrollCreateSchema.parse(data)
    const { error } = await supabase.from('payroll_records').insert(parsed)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updatePayrollAction(id: string, data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = PayrollUpdateSchema.parse(data)
    const { error } = await supabase.from('payroll_records').update(parsed).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deletePayrollAction(id: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('payroll_records').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updatePayrollStatusAction(id: string, status: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { status: validStatus } = PayrollStatusSchema.parse({ status })
    const { error } = await supabase.from('payroll_records').update({ status: validStatus }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
