-- =============================================================================
-- FleetCore — Configuración de Empresa (company_settings)
-- Tabla singleton: siempre existe exactamente 1 fila (id = 1)
-- Ejecutar en: Supabase > SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.company_settings (
  id              int         PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
  name            text        NOT NULL DEFAULT 'Mi Empresa C.A.',
  legal_name      text,                                              -- Razón social completa
  rif             text,                                              -- Ej: J-12345678-9
  address         text,
  city            text,
  phone           text,
  email           text,
  website         text,
  logo_url        text,                                              -- URL a imagen en storage
  currency        text        NOT NULL DEFAULT 'USD',               -- Moneda base del sistema
  invoice_footer  text,                                              -- Texto pie de página en facturas
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Solo puede existir la fila singleton
-- La inserción falla si ya existe una fila con id=1
INSERT INTO public.company_settings (id, name, currency)
VALUES (1, 'Mi Empresa C.A.', 'USD')
ON CONFLICT (id) DO NOTHING;

-- RLS: solo admins pueden modificar, todos los auth pueden leer
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read company_settings"
  ON public.company_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update company_settings"
  ON public.company_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_company_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_company_updated_at();

-- =============================================================================
-- Verificación
-- =============================================================================
SELECT name, rif, currency, updated_at FROM public.company_settings;
