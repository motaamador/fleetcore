-- =============================================================================
-- FleetCore — Módulo de Clientes y Contratos
-- 20260710000010_clients_contracts.sql
-- =============================================================================

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    rif             TEXT UNIQUE,
    address         TEXT,
    contact_person  TEXT,
    email           TEXT,
    phone           TEXT,
    status          TEXT DEFAULT 'active', -- active, inactive
    created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Contratos
CREATE TABLE IF NOT EXISTS public.contracts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_num    TEXT UNIQUE NOT NULL,
    client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    title           TEXT NOT NULL,
    description     TEXT,
    start_date      DATE,
    end_date        DATE,
    amount          NUMERIC(15,2) DEFAULT 0,
    currency        TEXT DEFAULT 'USD',
    status          TEXT DEFAULT 'draft', -- draft, active, completed, cancelled
    file_url        TEXT,
    created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Actualizar la tabla Projects para enlazar a Clients
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- 4. Triggers para updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS Policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Clientes: Solo autenticados pueden ver. Admin y Finanzas pueden editar.
DROP POLICY IF EXISTS "Authenticated can view clients" ON public.clients;
CREATE POLICY "Authenticated can view clients" ON public.clients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin and Finance can manage clients" ON public.clients;
CREATE POLICY "Admin and Finance can manage clients" ON public.clients FOR ALL TO authenticated 
USING (public.get_user_role() IN ('admin', 'finance'))
WITH CHECK (public.get_user_role() IN ('admin', 'finance'));

-- Contratos: Solo autenticados pueden ver. Admin y Finanzas pueden editar.
DROP POLICY IF EXISTS "Authenticated can view contracts" ON public.contracts;
CREATE POLICY "Authenticated can view contracts" ON public.contracts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin and Finance can manage contracts" ON public.contracts;
CREATE POLICY "Admin and Finance can manage contracts" ON public.contracts FOR ALL TO authenticated 
USING (public.get_user_role() IN ('admin', 'finance'))
WITH CHECK (public.get_user_role() IN ('admin', 'finance'));
