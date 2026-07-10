-- =============================================================================
-- FleetCore — Migración: Agregar campo ROTC a Vehículos
-- 20260709000003_vehicle_rotc.sql
-- =============================================================================

-- 1. Agregar columna rotc a vehicles (Opcional, ya que no todos los vehículos lo tienen)
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS rotc TEXT;
