-- =============================================================================
-- FleetCore — Módulo de Nóminas (Payroll)
-- 20260709000008_payroll.sql
-- =============================================================================

-- 1. Estatus de pago
DO $$ BEGIN
  CREATE TYPE payroll_status AS ENUM ('borrador', 'aprobado', 'pagado', 'anulado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabla de registros de nómina (Pagos a personal/choferes)
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    period_start    DATE            NOT NULL,
    period_end      DATE            NOT NULL,
    base_salary     NUMERIC(15, 2)  NOT NULL DEFAULT 0,
    bonuses         NUMERIC(15, 2)  NOT NULL DEFAULT 0,
    deductions      NUMERIC(15, 2)  NOT NULL DEFAULT 0,
    net_pay         NUMERIC(15, 2)  GENERATED ALWAYS AS (base_salary + bonuses - deductions) STORED,
    currency        TEXT            NOT NULL DEFAULT 'USD',
    status          payroll_status  NOT NULL DEFAULT 'borrador',
    payment_date    DATE,
    notes           TEXT,
    created_by      UUID            REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- 3. Trigger updated_at
DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON public.payroll_records;
CREATE TRIGGER update_payroll_records_updated_at
    BEFORE UPDATE ON public.payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance and admin can view payroll" ON public.payroll_records;
CREATE POLICY "Finance and admin can view payroll"
    ON public.payroll_records FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'finance'));

-- Choferes pueden ver su propia nómina
DROP POLICY IF EXISTS "Drivers can view own payroll" ON public.payroll_records;
CREATE POLICY "Drivers can view own payroll"
    ON public.payroll_records FOR SELECT TO authenticated
    USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Finance and admin can manage payroll" ON public.payroll_records;
CREATE POLICY "Finance and admin can manage payroll"
    ON public.payroll_records FOR ALL TO authenticated
    USING (public.get_user_role() IN ('admin', 'finance'))
    WITH CHECK (public.get_user_role() IN ('admin', 'finance'));
