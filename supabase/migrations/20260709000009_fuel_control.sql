-- =============================================================================
-- FleetCore — Control de Combustible
-- 20260709000009_fuel_control.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fuel_records (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id      UUID            NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    driver_id       UUID            REFERENCES public.profiles(id) ON DELETE SET NULL,
    date            DATE            NOT NULL DEFAULT CURRENT_DATE,
    liters          NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    cost            NUMERIC(15, 2)  NOT NULL DEFAULT 0,
    currency        TEXT            NOT NULL DEFAULT 'USD',
    odometer        NUMERIC(15, 2), -- Kilometraje al momento de la carga
    station_name    TEXT,           -- Estación de servicio
    notes           TEXT,
    created_by      UUID            REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_fuel_records_updated_at ON public.fuel_records;
CREATE TRIGGER update_fuel_records_updated_at
    BEFORE UPDATE ON public.fuel_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view fuel records" ON public.fuel_records;
CREATE POLICY "Authenticated can view fuel records"
    ON public.fuel_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin and dispatcher can manage fuel records" ON public.fuel_records;
CREATE POLICY "Admin and dispatcher can manage fuel records"
    ON public.fuel_records FOR ALL TO authenticated
    USING (public.get_user_role() IN ('admin', 'dispatcher', 'finance'))
    WITH CHECK (public.get_user_role() IN ('admin', 'dispatcher', 'finance'));
