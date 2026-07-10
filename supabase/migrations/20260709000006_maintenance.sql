-- =============================================================================
-- FleetCore — Módulo de Mantenimiento
-- 20260709000006_maintenance.sql
-- =============================================================================

-- 1. Tipo de mantenimiento
DO $$ BEGIN
  CREATE TYPE maintenance_type AS ENUM ('preventivo', 'correctivo', 'revision', 'emergencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('programado', 'en_proceso', 'completado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabla de registros de mantenimiento
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id      UUID                NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    type            maintenance_type    NOT NULL DEFAULT 'preventivo',
    status          maintenance_status  NOT NULL DEFAULT 'programado',
    description     TEXT                NOT NULL,
    workshop        TEXT,                         -- Nombre del taller
    cost            NUMERIC(15, 2)      DEFAULT 0,
    currency        TEXT                DEFAULT 'USD',
    mileage_at_service NUMERIC(10, 2),            -- Kilometraje al momento del servicio
    scheduled_date  DATE                NOT NULL,
    completed_date  DATE,
    notes           TEXT,
    created_by      UUID                REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ         DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         DEFAULT NOW()
);

-- 3. Trigger updated_at
DROP TRIGGER IF EXISTS update_maintenance_records_updated_at ON public.maintenance_records;
CREATE TRIGGER update_maintenance_records_updated_at
    BEFORE UPDATE ON public.maintenance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view maintenance" ON public.maintenance_records;
CREATE POLICY "Authenticated can view maintenance"
    ON public.maintenance_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin and dispatcher can manage maintenance" ON public.maintenance_records;
CREATE POLICY "Admin and dispatcher can manage maintenance"
    ON public.maintenance_records FOR ALL TO authenticated
    USING (public.get_user_role() IN ('admin', 'dispatcher'))
    WITH CHECK (public.get_user_role() IN ('admin', 'dispatcher'));

-- 5. Al crear un registro de mantenimiento 'en_proceso',
--    actualizar el vehículo a 'in_maintenance' automáticamente
CREATE OR REPLACE FUNCTION public.sync_vehicle_maintenance_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'en_proceso' THEN
        UPDATE public.vehicles SET status = 'in_maintenance' WHERE id = NEW.vehicle_id;
    ELSIF NEW.status = 'completado' THEN
        UPDATE public.vehicles SET status = 'active' WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_vehicle_on_maintenance ON public.maintenance_records;
CREATE TRIGGER sync_vehicle_on_maintenance
    AFTER INSERT OR UPDATE OF status ON public.maintenance_records
    FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_maintenance_status();
