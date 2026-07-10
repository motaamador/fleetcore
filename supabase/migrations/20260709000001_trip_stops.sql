-- Migration: 20260709000001_trip_stops.sql
-- Agrega soporte para rutas multi-parada en fletes
-- Cada parada es un punto de carga/descarga intermedio

-- 1. Enum para el tipo de parada
CREATE TYPE stop_type AS ENUM ('loading', 'unloading');

-- 2. Tabla de paradas intermedias de viaje
CREATE TABLE public.trip_stops (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id     UUID         NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    stop_order  INTEGER      NOT NULL,                   -- Orden de la parada: 1, 2, 3...
    location    TEXT         NOT NULL,                   -- Dirección / nombre del punto
    stop_type   stop_type    NOT NULL DEFAULT 'loading', -- loading | unloading
    notes       TEXT,                                    -- Observaciones opcionales
    arrived_at  TIMESTAMPTZ,                             -- Hora real de llegada (llenado por conductor)
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW(),

    -- Garantiza que no haya dos paradas con el mismo orden en el mismo viaje
    UNIQUE (trip_id, stop_order)
);

-- 3. Trigger para auto-actualizar updated_at
CREATE TRIGGER update_trip_stops_updated_at
    BEFORE UPDATE ON public.trip_stops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Habilitar RLS
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad
-- Cualquier usuario autenticado puede ver las paradas
CREATE POLICY "Anyone authenticated can view trip stops"
    ON public.trip_stops FOR SELECT
    USING (auth.role() = 'authenticated');

-- Solo el conductor asignado al viaje puede registrar su llegada a una parada
CREATE POLICY "Assigned driver can update their trip stops"
    ON public.trip_stops FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_stops.trip_id
              AND trips.driver_id = auth.uid()
        )
    );

-- Admins y despachadores gestionan las paradas
CREATE POLICY "Admins and dispatchers can manage trip stops"
    ON public.trip_stops FOR ALL
    USING (public.get_user_role() IN ('admin', 'dispatcher'));
