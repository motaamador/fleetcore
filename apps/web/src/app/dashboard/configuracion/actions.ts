'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import { InviteUserSchema, UpdateUserProfileSchema } from '@/lib/schemas'

const PATH = '/dashboard/configuracion'

/**
 * Crea el cliente Admin de Supabase usando la Service Role Key.
 * Este cliente bypasea RLS — solo para operaciones admin.
 * NUNCA exponer este cliente al frontend.
 */
function createAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada. Agrégala a .env.local')
  }

  return createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false },
  })
}

/**
 * Invita a un nuevo usuario a la plataforma.
 * Usa el Admin API de Supabase para crear la cuenta y enviar email de invitación.
 * Solo accesible por admin.
 */
export async function inviteUserAction(data: unknown) {
  try {
    await requireRole(['admin'])
    const parsed = InviteUserSchema.parse(data)
    const admin = createAdminClient()

    // 1. Crear usuario en auth con email de invitación
    const { data: authUser, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      parsed.email,
      {
        data: {
          full_name: parsed.full_name,
          role:      parsed.role,
        },
      }
    )

    if (inviteError) throw new Error(inviteError.message)

    // 2. Actualizar el perfil si ya se creó (puede que el trigger handle_new_user lo haga)
    if (authUser?.user?.id) {
      await admin.from('profiles').upsert({
        id:           authUser.user.id,
        full_name:    parsed.full_name,
        role:         parsed.role,
        phone_number: parsed.phone_number,
        is_active:    true,
      })
    }

    revalidatePath(PATH)
    return { success: true, message: `Invitación enviada a ${parsed.email}` }
  } catch (e) {
    return handleActionError(e)
  }
}

/**
 * Actualiza el perfil y rol de un usuario.
 * Solo accesible por admin.
 */
export async function updateUserProfileAction(userId: string, data: unknown) {
  try {
    const { supabase } = await requireRole(['admin'])
    const parsed = UpdateUserProfileSchema.parse(data)

    const { error } = await supabase
      .from('profiles')
      .update(parsed)
      .eq('id', userId)

    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

/**
 * Activa o desactiva un usuario (soft delete).
 * Solo accesible por admin.
 */
export async function toggleUserStatusAction(userId: string, is_active: boolean) {
  try {
    const { supabase } = await requireRole(['admin'])
    if (typeof is_active !== 'boolean') throw new Error('Estado inválido')

    const { error } = await supabase
      .from('profiles')
      .update({ is_active })
      .eq('id', userId)

    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

/**
 * Elimina un usuario permanentemente del sistema.
 * Requiere Admin API. Solo accesible por admin.
 */
export async function deleteUserAction(userId: string) {
  try {
    await requireRole(['admin'])
    const admin = createAdminClient()

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) throw new Error(error.message)

    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}
