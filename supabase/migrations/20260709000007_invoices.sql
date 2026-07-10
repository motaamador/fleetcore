-- =============================================================================
-- FleetCore — Módulo de Facturación
-- 20260709000007_invoices.sql
-- =============================================================================

-- 1. Estatus de factura
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('borrador', 'emitida', 'pagada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabla principal de facturas
CREATE TABLE IF NOT EXISTS public.invoices (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_num     TEXT            UNIQUE NOT NULL, -- FAC-2026-0001
    client_name     TEXT            NOT NULL,
    client_rif      TEXT,                            -- RIF del cliente
    project_id      UUID            REFERENCES public.projects(id) ON DELETE SET NULL,
    subtotal        NUMERIC(15, 2)  NOT NULL DEFAULT 0,
    tax_pct         NUMERIC(5, 2)   NOT NULL DEFAULT 16, -- IVA (16% Venezuela)
    tax_amount      NUMERIC(15, 2)  GENERATED ALWAYS AS (ROUND(subtotal * tax_pct / 100, 2)) STORED,
    total           NUMERIC(15, 2)  GENERATED ALWAYS AS (ROUND(subtotal + subtotal * tax_pct / 100, 2)) STORED,
    currency        TEXT            NOT NULL DEFAULT 'USD',
    status          invoice_status  NOT NULL DEFAULT 'borrador',
    issued_at       DATE            DEFAULT CURRENT_DATE,
    due_at          DATE,
    notes           TEXT,
    created_by      UUID            REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- 3. Líneas de detalle de la factura
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID            NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description     TEXT            NOT NULL,
    quantity        NUMERIC(10, 2)  NOT NULL DEFAULT 1,
    unit_price      NUMERIC(15, 2)  NOT NULL DEFAULT 0,
    subtotal        NUMERIC(15, 2)  GENERATED ALWAYS AS (ROUND(quantity * unit_price, 2)) STORED,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- 4. Función para generar número de factura automático
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    year_str TEXT;
BEGIN
    year_str := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(invoice_num, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE invoice_num LIKE 'FAC-' || year_str || '-%';

    NEW.invoice_num := 'FAC-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON public.invoices;
CREATE TRIGGER set_invoice_number
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    WHEN (NEW.invoice_num IS NULL OR NEW.invoice_num = '')
    EXECUTE FUNCTION public.generate_invoice_number();

-- 5. Trigger updated_at
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS
ALTER TABLE public.invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance and admin can view invoices" ON public.invoices;
CREATE POLICY "Finance and admin can view invoices"
    ON public.invoices FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'finance', 'dispatcher'));

DROP POLICY IF EXISTS "Finance and admin can manage invoices" ON public.invoices;
CREATE POLICY "Finance and admin can manage invoices"
    ON public.invoices FOR ALL TO authenticated
    USING (public.get_user_role() IN ('admin', 'finance'))
    WITH CHECK (public.get_user_role() IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Finance and admin can manage invoice items" ON public.invoice_items;
CREATE POLICY "Finance and admin can manage invoice items"
    ON public.invoice_items FOR ALL TO authenticated
    USING (public.get_user_role() IN ('admin', 'finance'))
    WITH CHECK (public.get_user_role() IN ('admin', 'finance'));
