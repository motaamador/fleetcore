'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import {
  ObraCreateSchema,
  ObraUpdateSchema,
  ObraStatusSchema,
} from '@/lib/schemas'

const ALLOWED_WRITE = ['admin'] as const
const PATH = '/dashboard/obras'

export async function createObra(data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = ObraCreateSchema.parse(data)
    const { error } = await supabase.from('projects').insert(parsed)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateObra(id: string, data: unknown) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const parsed = ObraUpdateSchema.parse(data)
    const { error } = await supabase.from('projects').update(parsed).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function deleteObra(id: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

export async function updateObraStatusAction(id: string, status: string) {
  try {
    const { supabase } = await requireRole([...ALLOWED_WRITE])
    const { status: validStatus } = ObraStatusSchema.parse({ status })
    const { error } = await supabase.from('projects').update({ status: validStatus }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
