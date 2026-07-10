-- =============================================================================
-- FleetCore — Migración: Políticas RLS para Desarrollo
-- 20260709000005_dev_rls_policies.sql
-- =============================================================================

-- Como estamos haciendo una prueba funcional desde la UI usando la llave pública (anon)
-- sin haber iniciado sesión con un usuario, necesitamos permitir a "anon"
-- insertar y actualizar en las tablas principales.

-- 1. Vehículos
DROP POLICY IF EXISTS "Anon can manage vehicles for dev" ON public.vehicles;
CREATE POLICY "Anon can manage vehicles for dev"
    ON public.vehicles FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. Viajes (Trips)
DROP POLICY IF EXISTS "Anon can manage trips for dev" ON public.trips;
CREATE POLICY "Anon can manage trips for dev"
    ON public.trips FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. Paradas (Trip Stops)
DROP POLICY IF EXISTS "Anon can manage trip stops for dev" ON public.trip_stops;
CREATE POLICY "Anon can manage trip stops for dev"
    ON public.trip_stops FOR ALL TO anon USING (true) WITH CHECK (true);
