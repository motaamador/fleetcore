'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import { requireRole, handleActionError } from '@/lib/action-guard'
import { InviteUserSchema, UpdateUserProfileSchema } from '@/lib/schemas'
import { z } from 'zod'

const PATH = '/dashboard/configuracion'

// ── Admin Client (bypasa RLS — solo Server Actions) ────────────────────────────
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada.')
  return createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false },
  })
}

// ── Schema de Empresa ─────────────────────────────────────────────────────────
const CompanySettingsSchema = z.object({
  name:           z.string().min(2, 'El nombre es obligatorio').max(120),
  legal_name:     z.string().max(200).optional().nullable(),
  rif:            z.string().max(20).optional().nullable(),
  address:        z.string().max(300).optional().nullable(),
  city:           z.string().max(100).optional().nullable(),
  phone:          z.string().max(30).optional().nullable(),
  email:          z.string().email().optional().nullable().or(z.literal('')),
  website:        z.string().url().optional().nullable().or(z.literal('')),
  logo_url:       z.string().url().optional().nullable().or(z.literal('')),
  currency:       z.enum(['USD', 'EUR', 'VES']).default('USD'),
  invoice_footer: z.string().max(500).optional().nullable(),
})

// ── Invitar usuario ───────────────────────────────────────────────────────────
export async function inviteUserAction(data: unknown) {
  try {
    await requireRole(['admin'])
    const parsed = InviteUserSchema.parse(data)
    const admin  = createAdminClient()

    const { data: authUser, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      parsed.email,
      { data: { full_name: parsed.full_name, role: parsed.role } }
    )
    if (inviteError) throw new Error(inviteError.message)

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

// ── Actualizar perfil de usuario ──────────────────────────────────────────────
export async function updateUserProfileAction(userId: string, data: unknown) {
  try {
    const { supabase } = await requireRole(['admin'])
    const parsed = UpdateUserProfileSchema.parse(data)
    const { error } = await supabase.from('profiles').update(parsed).eq('id', userId)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

// ── Activar / Desactivar usuario ──────────────────────────────────────────────
export async function toggleUserStatusAction(userId: string, is_active: boolean) {
  try {
    const { supabase } = await requireRole(['admin'])
    if (typeof is_active !== 'boolean') throw new Error('Estado inválido')
    const { error } = await supabase.from('profiles').update({ is_active }).eq('id', userId)
    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

// ── Eliminar usuario permanentemente ─────────────────────────────────────────
export async function deleteUserAction(userId: string) {
  try {
    await requireRole(['admin'])
    const admin = createAdminClient()

    // Limpiar FKs primero para evitar constraint violations
    await admin.from('payroll_records').delete().eq('profile_id', userId)
    await admin.from('trips').update({ driver_id: null }).eq('driver_id', userId)
    await admin.from('fuel_records').update({ driver_id: null }).eq('driver_id', userId)

    // Intentar borrar de Auth (puede que no exista si es perfil huérfano)
    await admin.auth.admin.deleteUser(userId).catch(() => {})

    // Borrar el profile directamente
    const { error } = await admin.from('profiles').delete().eq('id', userId)
    if (error) throw new Error(error.message)

    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    return handleActionError(e)
  }
}

// ── Guardar configuración de empresa ─────────────────────────────────────────
export async function saveCompanySettingsAction(data: unknown) {
  try {
    const { supabase } = await requireRole(['admin'])
    const parsed = CompanySettingsSchema.parse(data)

    // Limpiar strings vacíos a null
    const clean = Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, v === '' ? null : v])
    )

    const { error } = await supabase
      .from('company_settings')
      .update(clean)
      .eq('id', 1)

    if (error) throw new Error(error.message)
    revalidatePath(PATH)
    revalidatePath('/dashboard/facturacion') // invalidar facturas para reflejar nuevo membrete
    return { success: true, message: 'Configuración guardada correctamente.' }
  } catch (e) {
    return handleActionError(e)
  }
}
