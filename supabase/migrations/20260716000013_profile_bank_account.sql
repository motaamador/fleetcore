-- =============================================================================
-- FleetCore — Datos Bancarios del Personal
-- 20260716000013_profile_bank_account.sql
-- =============================================================================

-- Agregar columnas bancarias a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name           TEXT;
