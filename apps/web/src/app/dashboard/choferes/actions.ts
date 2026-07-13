'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, requireAuth, handleActionError } from '@/lib/action-guard'
import { ChoferCreateSchema, ChoferUpdateSchema } from '@/lib/schemas'

const PATH = '/dashboard/choferes'

export async function createChofer(data: unknown) {
  try {
    // Solo admin puede crear perfiles de choferes
    const { supabase } = await requireRole(['admin'])
    const parsed = ChoferCreateSchema.parse(data)
    const { error } = await supabase.from('profiles').insert({
      ...parsed,
      role: 'driver',
    })
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateChofer(id: string, data: unknown) {
  try {
    const { supabase } = await requireRole(['admin'])
    const parsed = ChoferUpdateSchema.parse(data)
    const { error } = await supabase.from('profiles').update(parsed).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deleteChofer(id: string) {
  try {
    const { supabase } = await requireRole(['admin'])
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateChoferStatusAction(id: string, is_active: boolean) {
  try {
    const { supabase } = await requireRole(['admin', 'dispatcher'])
    if (typeof is_active !== 'boolean') throw new Error('Estado inválido')
    const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
