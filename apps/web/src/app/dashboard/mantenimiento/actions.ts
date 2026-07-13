'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import {
  MaintenanceCreateSchema,
  MaintenanceUpdateSchema,
  MaintenanceStatusSchema,
} from '@/lib/schemas'

const ALLOWED_WRITE = ['admin', 'dispatcher'] as const
const PATH = '/dashboard/mantenimiento'

export async function createMaintenanceAction(data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = MaintenanceCreateSchema.parse(data)
    const { error } = await supabase.from('maintenance_records').insert(parsed)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateMaintenanceAction(id: string, data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = MaintenanceUpdateSchema.parse(data)
    const { error } = await supabase.from('maintenance_records').update(parsed).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deleteMaintenanceAction(id: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('maintenance_records').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateMaintenanceStatusAction(id: string, status: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { status: validStatus } = MaintenanceStatusSchema.parse({ status })
    const { error } = await supabase.from('maintenance_records').update({ status: validStatus }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
