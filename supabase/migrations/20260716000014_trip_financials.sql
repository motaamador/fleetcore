-- =============================================================================
-- FleetCore — Costos Financieros por Flete
-- 20260716000014_trip_financials.sql
-- =============================================================================

-- Agregar campos financieros a la tabla trips
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS precio_flete   NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS precio_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS bono_chofer    NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS bono_currency  TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS viaticos       NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS viaticos_currency TEXT DEFAULT 'USD';

-- Comentarios para documentación
COMMENT ON COLUMN public.trips.precio_flete    IS 'Monto cobrado al cliente por el flete';
COMMENT ON COLUMN public.trips.bono_chofer     IS 'Comisión o bono pagado al chofer por este viaje';
COMMENT ON COLUMN public.trips.viaticos        IS 'Viáticos entregados al chofer (peajes, comida, etc.)';
