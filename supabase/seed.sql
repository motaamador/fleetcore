-- =============================================================================
-- FleetCore — Seed de Datos de Prueba
-- Ejecutar en: Supabase > SQL Editor
-- NOTA: Los profiles/conductores requieren usuarios reales de Supabase Auth.
--       Los fletes se crean sin driver_id asignado (se asignan desde la UI).
-- =============================================================================

-- 1. LIMPIAR datos anteriores (en orden inverso de dependencias)
TRUNCATE public.trip_stops   RESTART IDENTITY CASCADE;
TRUNCATE public.transactions  RESTART IDENTITY CASCADE;
TRUNCATE public.trips         RESTART IDENTITY CASCADE;
TRUNCATE public.projects      RESTART IDENTITY CASCADE;
TRUNCATE public.vehicles      RESTART IDENTITY CASCADE;

-- =============================================================================
-- 2. VEHÍCULOS
-- =============================================================================
INSERT INTO public.vehicles (plate_number, make, model, year, type, capacity_kg, status, current_mileage) VALUES
('TRK-001', 'Volvo',      'VNL 860',       2022, 'truck',          36000.00, 'active',         125430.00),
('TRK-002', 'Kenworth',   'T680',          2020, 'truck',          35000.00, 'in_maintenance', 210800.00),
('TRK-003', 'Peterbilt',  '579',           2019, 'truck',          34000.00, 'active',         305620.00),
('TRK-004', 'Freightliner','Cascadia 126', 2023, 'truck',          38000.00, 'active',          48200.00),
('MAC-001', 'Caterpillar','320 Excavator', 2021, 'heavy_machinery', NULL,    'active',           4320.00),
('MAC-002', 'Komatsu',    'PC210LC',       2020, 'heavy_machinery', NULL,    'in_maintenance',   8750.00),
('VAN-001', 'Ford',       'Transit 350',   2023, 'van',             2000.00, 'active',          18500.00),
('VAN-002', 'Mercedes',   'Sprinter 315',  2022, 'van',             1800.00, 'active',          32100.00),
('PCK-001', 'Toyota',     'Hilux 4x4',     2023, 'pickup',          1000.00, 'active',          15200.00);

-- =============================================================================
-- 3. PROYECTOS (OBRAS)
-- =============================================================================
INSERT INTO public.projects (name, description, location, client_name, budget, status, start_date, end_date) VALUES
(
  'Autopista Norte Fase 2',
  'Ampliación de carriles, pavimentación y señalización horizontal. Tramo de 42 km.',
  'Km 18, Ruta 001 — Sector Norte',
  'Ministerio de Infraestructura',
  5000000.00, 'active',
  '2026-03-01', '2026-12-31'
),
(
  'Condominio Las Brisas',
  'Movimiento de tierras, cimentación y construcción de 8 torres residenciales.',
  'Baruta, Edo. Miranda',
  'Constructora Horizonte C.A.',
  1200000.00, 'active',
  '2026-05-15', '2027-06-30'
),
(
  'Expansión Puerto Cabello',
  'Ampliación de muelles y construcción de nuevas instalaciones portuarias.',
  'Puerto Cabello, Edo. Carabobo',
  'Autoridad Única de Área de Puerto Cabello',
  8500000.00, 'active',
  '2026-01-10', '2027-03-15'
),
(
  'Viaducto Río Tuy',
  'Construcción de viaducto de 380 metros sobre el Río Tuy.',
  'Ocumare del Tuy, Edo. Miranda',
  'Gobernación del Estado Miranda',
  3200000.00, 'planning',
  '2026-09-01', '2028-01-31'
),
(
  'Planta Industrial Zona Franca',
  'Construcción de galpón industrial de 12,000 m² con oficinas.',
  'Zona Industrial, Valencia, Edo. Carabobo',
  'Inversiones del Centro C.A.',
  950000.00, 'on_hold',
  '2026-04-01', '2026-11-30'
);

-- =============================================================================
-- 4. FLETES / VIAJES
-- Capturamos los IDs de vehículos y proyectos para referencias
-- =============================================================================
DO $$
DECLARE
  v_trk001 UUID; v_trk002 UUID; v_trk003 UUID; v_trk004 UUID;
  v_van001 UUID; v_pck001 UUID;
  p_norte  UUID; p_brisas UUID; p_puerto UUID; p_tuy UUID;
  t1 UUID; t2 UUID; t3 UUID; t4 UUID; t5 UUID; t6 UUID;
BEGIN

  -- Obtener IDs de vehículos
  SELECT id INTO v_trk001 FROM public.vehicles WHERE plate_number = 'TRK-001';
  SELECT id INTO v_trk002 FROM public.vehicles WHERE plate_number = 'TRK-002';
  SELECT id INTO v_trk003 FROM public.vehicles WHERE plate_number = 'TRK-003';
  SELECT id INTO v_trk004 FROM public.vehicles WHERE plate_number = 'TRK-004';
  SELECT id INTO v_van001  FROM public.vehicles WHERE plate_number = 'VAN-001';
  SELECT id INTO v_pck001  FROM public.vehicles WHERE plate_number = 'PCK-001';

  -- Obtener IDs de proyectos
  SELECT id INTO p_norte  FROM public.projects WHERE name = 'Autopista Norte Fase 2';
  SELECT id INTO p_brisas FROM public.projects WHERE name = 'Condominio Las Brisas';
  SELECT id INTO p_puerto FROM public.projects WHERE name = 'Expansión Puerto Cabello';
  SELECT id INTO p_tuy    FROM public.projects WHERE name = 'Viaducto Río Tuy';

  -- ── Flete 1: En tránsito con 2 paradas intermedias ──────────────────────────
  INSERT INTO public.trips
    (id, project_id, vehicle_id, origin, destination, distance_km, status, departure_time)
  VALUES
    (uuid_generate_v4(), p_norte, v_trk001,
     'Planta Central, Valencia',
     'Autopista Norte Km 18',
     145.00, 'in_transit',
     NOW() - INTERVAL '2 hours')
  RETURNING id INTO t1;

  INSERT INTO public.trip_stops (trip_id, stop_order, location, stop_type, notes) VALUES
    (t1, 1, 'Depósito Maracay — Av. Las Delicias',     'loading',   'Carga de asfalto RC-250, 18 toneladas'),
    (t1, 2, 'Almacén Valencia Norte — Zona Industrial', 'unloading', 'Descarga parcial de materiales áridos');

  -- ── Flete 2: Completado sin paradas ─────────────────────────────────────────
  INSERT INTO public.trips
    (id, project_id, vehicle_id, origin, destination, distance_km, status, departure_time, arrival_time)
  VALUES
    (uuid_generate_v4(), p_brisas, v_van001,
     'Almacén Principal, Caracas',
     'Condominio Las Brisas, Baruta',
     42.50, 'completed',
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '22 hours')
  RETURNING id INTO t2;

  -- ── Flete 3: Programado con 3 paradas (ruta compleja) ───────────────────────
  INSERT INTO public.trips
    (id, project_id, vehicle_id, origin, destination, distance_km, status)
  VALUES
    (uuid_generate_v4(), p_puerto, v_trk003,
     'Mina Norte — Puerto Ordaz',
     'Expansión Puerto Cabello',
     520.00, 'scheduled')
  RETURNING id INTO t3;

  INSERT INTO public.trip_stops (trip_id, stop_order, location, stop_type, notes) VALUES
    (t3, 1, 'Báscula Nortecentro — Maracay',      'loading',   'Pesaje y carga de materiales de relleno'),
    (t3, 2, 'Refinería El Palito — Puerto Cabello','unloading', 'Descarga de insumos químicos'),
    (t3, 3, 'Terminal de Carga — Puerto Cabello',  'loading',   'Recarga de equipos portuarios');

  -- ── Flete 4: Cancelado sin obra asignada (traslado interno) ─────────────────
  INSERT INTO public.trips
    (id, project_id, vehicle_id, origin, destination, distance_km, status)
  VALUES
    (uuid_generate_v4(), NULL, v_trk002,
     'Taller Mecánico Central',
     'Depósito Zona Norte',
     35.00, 'cancelled')
  RETURNING id INTO t4;

  -- ── Flete 5: En tránsito — ruta directa ──────────────────────────────────────
  INSERT INTO public.trips
    (id, project_id, vehicle_id, origin, destination, distance_km, status, departure_time)
  VALUES
    (uuid_generate_v4(), p_tuy, v_trk004,
     'Planta de Concreto — Los Teques',
     'Viaducto Río Tuy — Ocumare',
     95.00, 'in_transit',
     NOW() - INTERVAL '30 minutes')
  RETURNING id INTO t5;

  INSERT INTO public.trip_stops (trip_id, stop_order, location, stop_type, notes) VALUES
    (t5, 1, 'Cantón de Obras — Sto. Domingo', 'loading', 'Recolección de acero estructural');

  -- ── Flete 6: Completado ayer ─────────────────────────────────────────────────
  INSERT INTO public.trips
    (id, project_id, vehicle_id, origin, destination, distance_km, status, departure_time, arrival_time)
  VALUES
    (uuid_generate_v4(), p_brisas, v_pck001,
     'Ferretería Industrial, Caracas',
     'Condominio Las Brisas, Baruta',
     38.00, 'completed',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '46 hours')
  RETURNING id INTO t6;

  -- ── Transacciones financieras relacionadas ─────────────────────────────────
  INSERT INTO public.transactions (type, amount, description, date, project_id, trip_id) VALUES
    ('income',  12500.00, 'Servicio de flete — Autopista Norte Fase 2',    CURRENT_DATE,                p_norte,  t1),
    ('expense',  3200.00, 'Combustible — Volvo VNL 860 (TRK-001)',         CURRENT_DATE,                p_norte,  t1),
    ('income',   4800.00, 'Servicio de flete — Condominio Las Brisas',     CURRENT_DATE - INTERVAL '1 day', p_brisas, t2),
    ('expense',   850.00, 'Combustible — Ford Transit 350 (VAN-001)',      CURRENT_DATE - INTERVAL '1 day', p_brisas, t2),
    ('income',  38000.00, 'Anticipo Flete Puerto Cabello',                 CURRENT_DATE,                p_puerto, t3),
    ('income',   9200.00, 'Servicio de flete — Viaducto Río Tuy',         CURRENT_DATE,                p_tuy,    t5),
    ('expense',  2100.00, 'Combustible — Freightliner Cascadia (TRK-004)', CURRENT_DATE,                p_tuy,    t5),
    ('income',   3600.00, 'Servicio de flete — Condominio Las Brisas #2',  CURRENT_DATE - INTERVAL '2 days', p_brisas, t6);

END $$;

-- =============================================================================
-- Verificación rápida
-- =============================================================================
SELECT 'Vehículos'     AS tabla, COUNT(*) AS registros FROM public.vehicles     UNION ALL
SELECT 'Proyectos'     AS tabla, COUNT(*) AS registros FROM public.projects     UNION ALL
SELECT 'Fletes'        AS tabla, COUNT(*) AS registros FROM public.trips        UNION ALL
SELECT 'Paradas'       AS tabla, COUNT(*) AS registros FROM public.trip_stops   UNION ALL
SELECT 'Transacciones' AS tabla, COUNT(*) AS registros FROM public.transactions;
