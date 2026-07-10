-- =============================================================================
-- FleetCore — Migración Inicial (Idempotente)
-- 20260708000000_initial_schema.sql
-- Se puede ejecutar múltiples veces de forma segura.
-- =============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Types (Enums) — envueltos en bloques DO para evitar error si ya existen
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'dispatcher', 'driver', 'finance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('truck', 'heavy_machinery', 'van', 'pickup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM ('active', 'in_maintenance', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'on_hold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('scheduled', 'in_transit', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Tabla de Perfiles (vinculada con auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role         user_role   NOT NULL DEFAULT 'driver',
    full_name    TEXT        NOT NULL,
    phone_number TEXT,
    avatar_url   TEXT,
    is_active    BOOLEAN     DEFAULT true,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Vehículos
CREATE TABLE IF NOT EXISTS public.vehicles (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number    TEXT            UNIQUE NOT NULL,
    make            TEXT            NOT NULL,
    model           TEXT            NOT NULL,
    year            INTEGER,
    type            vehicle_type    NOT NULL,
    capacity_kg     NUMERIC(10, 2),
    status          vehicle_status  DEFAULT 'active',
    current_mileage NUMERIC(10, 2)  DEFAULT 0,
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- 5. Tabla de Proyectos (Obras)
CREATE TABLE IF NOT EXISTS public.projects (
    id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT            NOT NULL,
    description TEXT,
    location    TEXT            NOT NULL,
    client_name TEXT,
    budget      NUMERIC(15, 2)  DEFAULT 0.00,
    status      project_status  DEFAULT 'planning',
    start_date  DATE,
    end_date    DATE,
    created_at  TIMESTAMPTZ     DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     DEFAULT NOW()
);

-- 6. Tabla de Viajes / Fletes
CREATE TABLE IF NOT EXISTS public.trips (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id     UUID         REFERENCES public.projects(id) ON DELETE SET NULL,
    vehicle_id     UUID         REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    driver_id      UUID         REFERENCES public.profiles(id) ON DELETE RESTRICT,
    origin         TEXT         NOT NULL,
    destination    TEXT         NOT NULL,
    distance_km    NUMERIC(10, 2),
    status         trip_status  DEFAULT 'scheduled',
    departure_time TIMESTAMPTZ,
    arrival_time   TIMESTAMPTZ,
    notes          TEXT,
    created_at     TIMESTAMPTZ  DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- 7. Tabla de Transacciones Financieras
CREATE TABLE IF NOT EXISTS public.transactions (
    id          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    type        transaction_type  NOT NULL,
    amount      NUMERIC(15, 2)    NOT NULL CHECK (amount >= 0),
    description TEXT              NOT NULL,
    date        DATE              NOT NULL DEFAULT CURRENT_DATE,
    project_id  UUID              REFERENCES public.projects(id) ON DELETE SET NULL,
    trip_id     UUID              REFERENCES public.trips(id) ON DELETE SET NULL,
    vehicle_id  UUID              REFERENCES public.vehicles(id) ON DELETE SET NULL,
    created_by  UUID              REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ       DEFAULT NOW(),
    updated_at  TIMESTAMPTZ       DEFAULT NOW()
);

-- 8. Función para auto-actualizar `updated_at`
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at (DROP + CREATE para idempotencia)
DROP TRIGGER IF EXISTS update_profiles_updated_at     ON public.profiles;
DROP TRIGGER IF EXISTS update_vehicles_updated_at     ON public.vehicles;
DROP TRIGGER IF EXISTS update_projects_updated_at     ON public.projects;
DROP TRIGGER IF EXISTS update_trips_updated_at        ON public.trips;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Trigger para Auto-Crear Perfil al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'driver'::user_role)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Función helper para RLS (evita recursión infinita)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 11. Habilitar RLS
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 12. Políticas RLS (DROP + CREATE para idempotencia)

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"       ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles"     ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Vehículos
DROP POLICY IF EXISTS "Anyone authenticated can view vehicles"          ON public.vehicles;
DROP POLICY IF EXISTS "Admins and dispatchers can manage vehicles"      ON public.vehicles;

CREATE POLICY "Anyone authenticated can view vehicles"
    ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and dispatchers can manage vehicles"
    ON public.vehicles FOR ALL USING (public.get_user_role() IN ('admin', 'dispatcher'));

-- Proyectos
DROP POLICY IF EXISTS "Anyone authenticated can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects"             ON public.projects;

CREATE POLICY "Anyone authenticated can view projects"
    ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage projects"
    ON public.projects FOR ALL USING (public.get_user_role() = 'admin');

-- Viajes / Fletes
DROP POLICY IF EXISTS "Anyone authenticated can view trips"           ON public.trips;
DROP POLICY IF EXISTS "Drivers can update their own trips"            ON public.trips;
DROP POLICY IF EXISTS "Admins and dispatchers can manage trips"       ON public.trips;

CREATE POLICY "Anyone authenticated can view trips"
    ON public.trips FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Drivers can update their own trips"
    ON public.trips FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Admins and dispatchers can manage trips"
    ON public.trips FOR ALL USING (public.get_user_role() IN ('admin', 'dispatcher'));

-- Transacciones
DROP POLICY IF EXISTS "Finance and Admins can view transactions"   ON public.transactions;
DROP POLICY IF EXISTS "Finance and Admins can manage transactions" ON public.transactions;

CREATE POLICY "Finance and Admins can view transactions"
    ON public.transactions FOR SELECT USING (public.get_user_role() IN ('admin', 'finance'));
CREATE POLICY "Finance and Admins can manage transactions"
    ON public.transactions FOR ALL USING (public.get_user_role() IN ('admin', 'finance'));
