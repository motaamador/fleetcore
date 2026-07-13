'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import { FuelCreateSchema, FuelUpdateSchema } from '@/lib/schemas'

const ALLOWED_WRITE = ['admin', 'dispatcher', 'finance'] as const
const PATH = '/dashboard/combustible'

export async function createFuelAction(data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = FuelCreateSchema.parse(data)
    const { error } = await supabase.from('fuel_records').insert(parsed)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateFuelAction(id: string, data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = FuelUpdateSchema.parse(data)
    const { error } = await supabase.from('fuel_records').update(parsed).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deleteFuelAction(id: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('fuel_records').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
