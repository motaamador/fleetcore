-- =============================================================================
-- FleetCore — Módulo de Telemetría (GPS)
-- 20260714000012_vehicle_telemetry.sql
-- =============================================================================

-- 1. Agregar columnas de ubicación a la tabla vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS current_lat NUMERIC(10, 6),
ADD COLUMN IF NOT EXISTS current_lng NUMERIC(10, 6),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- 2. Habilitar Supabase Realtime para la tabla vehicles
-- Para que el mapa se actualice en tiempo real sin recargar la página.
-- Primero verificamos si ya está en la publicación 'supabase_realtime' y si no, la añadimos.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'vehicles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Puede fallar si la publicación no existe en un entorno dev básico
  NULL;
END $$;
