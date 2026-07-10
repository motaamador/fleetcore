-- =============================================================================
-- FleetCore — Migración: Multi-moneda en Proyectos
-- 20260709000002_project_currency.sql
-- =============================================================================

-- 1. Agregar columna currency a projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3)
    NOT NULL DEFAULT 'USD'
    CHECK (currency IN ('USD', 'EUR', 'VES'));

-- 2. Políticas anon para desarrollo (INSERT / UPDATE / DELETE en projects)
--    Se reemplazarán por políticas de rol cuando implementemos Auth.
DROP POLICY IF EXISTS "Anon can insert projects for dev" ON public.projects;
DROP POLICY IF EXISTS "Anon can update projects for dev" ON public.projects;
DROP POLICY IF EXISTS "Anon can delete projects for dev" ON public.projects;

CREATE POLICY "Anon can insert projects for dev"
    ON public.projects FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update projects for dev"
    ON public.projects FOR UPDATE TO anon USING (true);

CREATE POLICY "Anon can delete projects for dev"
    ON public.projects FOR DELETE TO anon USING (true);
