/**
 * action-guard.ts
 * Helper centralizado para verificar autenticación y autorización
 * en todos los Server Actions de FleetCore.
 */
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'finance'

export class ActionError extends Error {
  constructor(message: string, public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION' = 'UNAUTHORIZED') {
    super(message)
    this.name = 'ActionError'
  }
}

/**
 * Verifica que el usuario tenga sesión activa y retorna su perfil completo.
 * Lanza ActionError si no está autenticado.
 */
export async function requireAuth() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new ActionError('No autenticado. Por favor inicia sesión.', 'UNAUTHORIZED')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    throw new ActionError('Cuenta desactivada o sin perfil. Contacta al administrador.', 'FORBIDDEN')
  }

  return { user, profile, supabase }
}

/**
 * Verifica que el usuario tenga uno de los roles especificados.
 * Lanza ActionError si no tiene permisos.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const context = await requireAuth()
  const { profile } = context

  if (!allowedRoles.includes(profile.role as UserRole)) {
    throw new ActionError(
      `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}. Tu rol actual: ${profile.role}`,
      'FORBIDDEN'
    )
  }

  return context
}

/**
 * Formatea errores de Zod o ActionError en un objeto de respuesta estandarizado.
 * Úsalo en el catch de los Server Actions para no exponer stack traces.
 */
export function handleActionError(error: unknown): { success: false; error: string } {
  if (error instanceof ActionError) {
    return { success: false, error: error.message }
  }
  if (error instanceof Error) {
    // No exponer mensajes internos de Postgres en producción
    const msg = process.env.NODE_ENV === 'development'
      ? error.message
      : 'Error interno del servidor. Intenta de nuevo.'
    return { success: false, error: msg }
  }
  return { success: false, error: 'Error desconocido.' }
}
