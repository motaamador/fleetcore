'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import { ContractCreateSchema, ContractUpdateSchema } from '@/lib/schemas'

const ALLOWED_WRITE = ['admin', 'finance'] as const
const PATH = '/dashboard/contratos'

export async function createContractAction(data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = ContractCreateSchema.parse(data)
    const { error } = await supabase.from('contracts').insert(parsed)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateContractAction(id: string, data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = ContractUpdateSchema.parse(data)
    const { error } = await supabase.from('contracts').update(parsed).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deleteContractAction(id: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('contracts').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
