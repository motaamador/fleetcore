-- =============================================================================
-- FleetCore — Migración: Agregar campos a Choferes/Perfiles
-- 20260709000004_driver_fields.sql
-- =============================================================================

-- 1. Agregar C.I. y Tipo de Licencia
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cedula_identidad TEXT,
  ADD COLUMN IF NOT EXISTS licencia_tipo TEXT;

-- 2. Para facilitar el desarrollo y permitir agregar choferes desde la UI
-- sin tener que registrar usuarios reales en Supabase Auth, quitamos la restricción 
-- de llave foránea temporalmente (podremos volver a agregarla en producción).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Permitir a los usuarios anónimos (en desarrollo) insertar perfiles
DROP POLICY IF EXISTS "Anon can insert profiles for dev" ON public.profiles;
CREATE POLICY "Anon can insert profiles for dev"
    ON public.profiles FOR INSERT TO anon WITH CHECK (true);
