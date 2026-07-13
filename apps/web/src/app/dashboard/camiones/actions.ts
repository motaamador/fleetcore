'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import {
  VehicleCreateSchema,
  VehicleUpdateSchema,
  VehicleStatusSchema,
} from '@/lib/schemas'

const ALLOWED_WRITE = ['admin', 'dispatcher'] as const
const PATH = '/dashboard/camiones'

export async function createCamion(data: unknown) {
  try {
    await requireRole([...ALLOWED_WRITE])
    const parsed = VehicleCreateSchema.parse(data)
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('vehicles').insert(parsed)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateCamion(id: string, data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = VehicleUpdateSchema.parse(data)
    const { error } = await supabase.from('vehicles').update(parsed).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deleteCamion(id: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateCamionStatusAction(id: string, status: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { status: validStatus } = VehicleStatusSchema.parse({ status })
    const { error } = await supabase.from('vehicles').update({ status: validStatus }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
