/**
 * schemas.ts
 * Schemas Zod centralizados para validar los inputs de todos
 * los Server Actions de FleetCore.
 * 
 * Convención: cada módulo tiene su schema de Create y Update.
 * Los Updates son parciales (.partial()) salvo campos críticos.
 */
import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers comunes
// ─────────────────────────────────────────────────────────────────────────────

const uuid = z.string().uuid({ message: 'ID inválido' })
const optionalUuid = z.string().uuid({ message: 'ID inválido' }).optional().nullable()
const positiveNumber = z.coerce.number().min(0, 'Debe ser mayor o igual a 0')
const currency = z.enum(['USD', 'VES', 'EUR'], { errorMap: () => ({ message: 'Moneda inválida' }) })
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
const optionalDateStr = dateStr.optional().nullable()

// ─────────────────────────────────────────────────────────────────────────────
// CAMIONES (vehicles)
// ─────────────────────────────────────────────────────────────────────────────

export const VehicleCreateSchema = z.object({
  plate_number:    z.string().min(4).max(10).toUpperCase(),
  make:            z.string().min(2).max(100),
  model:           z.string().min(1).max(100),
  year:            z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1).optional().nullable(),
  type:            z.enum(['truck', 'heavy_machinery', 'van', 'pickup']),
  capacity_kg:     positiveNumber.optional().nullable(),
  current_mileage: positiveNumber.optional(),
  status:          z.enum(['active', 'in_maintenance', 'inactive']).optional(),
})

export const VehicleUpdateSchema = VehicleCreateSchema.partial()

export const VehicleStatusSchema = z.object({
  status: z.enum(['active', 'in_maintenance', 'inactive']),
})

// ─────────────────────────────────────────────────────────────────────────────
// CHOFERES (profiles con role=driver)
// ─────────────────────────────────────────────────────────────────────────────

export const ChoferCreateSchema = z.object({
  full_name:    z.string().min(3).max(150),
  phone_number: z.string().max(20).optional().nullable(),
  avatar_url:   z.string().url().optional().nullable(),
  is_active:    z.boolean().optional(),
  // id viene de auth.users — no se puede crear desde el form sin Admin API
  id:           uuid.optional(),
})

export const ChoferUpdateSchema = ChoferCreateSchema.partial()

// ─────────────────────────────────────────────────────────────────────────────
// OBRAS (projects)
// ─────────────────────────────────────────────────────────────────────────────

export const ObraCreateSchema = z.object({
  name:        z.string().min(3).max(200),
  description: z.string().max(2000).optional().nullable(),
  location:    z.string().min(3).max(300),
  client_name: z.string().max(200).optional().nullable(),
  client_id:   optionalUuid,
  budget:      positiveNumber.optional(),
  currency:    currency.optional(),
  status:      z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
  start_date:  optionalDateStr,
  end_date:    optionalDateStr,
})

export const ObraUpdateSchema = ObraCreateSchema.partial()

export const ObraStatusSchema = z.object({
  status: z.enum(['planning', 'active', 'completed', 'on_hold']),
})

// ─────────────────────────────────────────────────────────────────────────────
// FLETES (trips)
// ─────────────────────────────────────────────────────────────────────────────

export const TripStopSchema = z.object({
  location:  z.string().min(2).max(300),
  stop_type: z.enum(['pickup', 'delivery', 'checkpoint']).optional(),
  notes:     z.string().max(500).optional().nullable(),
})

export const TripCreateSchema = z.object({
  vehicle_id:     uuid,
  driver_id:      uuid,
  project_id:     optionalUuid,
  origin:         z.string().min(2).max(300),
  destination:    z.string().min(2).max(300),
  distance_km:    positiveNumber.optional().nullable(),
  status:         z.enum(['scheduled', 'in_transit', 'completed', 'cancelled']).optional(),
  departure_time: z.string().datetime({ offset: true }).optional().nullable(),
  arrival_time:   z.string().datetime({ offset: true }).optional().nullable(),
  notes:          z.string().max(2000).optional().nullable(),
})

export const TripStatusSchema = z.object({
  status: z.enum(['scheduled', 'in_transit', 'completed', 'cancelled']),
})

// ─────────────────────────────────────────────────────────────────────────────
// MANTENIMIENTO (maintenance_records)
// ─────────────────────────────────────────────────────────────────────────────

export const MaintenanceCreateSchema = z.object({
  vehicle_id:         uuid,
  type:               z.enum(['preventivo', 'correctivo', 'revision', 'emergencia']),
  status:             z.enum(['programado', 'en_proceso', 'completado', 'cancelado']).optional(),
  description:        z.string().min(5).max(2000),
  workshop:           z.string().max(200).optional().nullable(),
  cost:               positiveNumber.optional(),
  currency:           currency.optional(),
  mileage_at_service: positiveNumber.optional().nullable(),
  scheduled_date:     dateStr,
  completed_date:     optionalDateStr,
  notes:              z.string().max(2000).optional().nullable(),
})

export const MaintenanceUpdateSchema = MaintenanceCreateSchema.partial()

export const MaintenanceStatusSchema = z.object({
  status: z.enum(['programado', 'en_proceso', 'completado', 'cancelado']),
})

// ─────────────────────────────────────────────────────────────────────────────
// FACTURACIÓN (invoices)
// ─────────────────────────────────────────────────────────────────────────────

export const InvoiceItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity:    z.coerce.number().positive('Cantidad debe ser mayor a 0'),
  unit_price:  z.coerce.number().min(0, 'Precio debe ser mayor o igual a 0'),
})

export const InvoiceCreateSchema = z.object({
  client_name: z.string().min(2).max(200),
  client_rif:  z.string().max(20).optional().nullable(),
  project_id:  optionalUuid,
  subtotal:    positiveNumber,
  tax_pct:     z.coerce.number().min(0).max(50),
  currency:    currency,
  status:      z.enum(['borrador', 'emitida', 'pagada', 'cancelada']).optional(),
  issued_at:   optionalDateStr,
  due_at:      optionalDateStr,
  notes:       z.string().max(2000).optional().nullable(),
  invoice_num: z.string().max(30).optional(), // se genera automáticamente en DB
})

export const InvoiceStatusSchema = z.object({
  status: z.enum(['borrador', 'emitida', 'pagada', 'cancelada']),
})

// ─────────────────────────────────────────────────────────────────────────────
// NÓMINAS (payroll_records)
// ─────────────────────────────────────────────────────────────────────────────

export const PayrollCreateSchema = z.object({
  profile_id:   uuid,
  period_start: dateStr,
  period_end:   dateStr,
  base_salary:  positiveNumber,
  bonuses:      positiveNumber.optional(),
  deductions:   positiveNumber.optional(),
  currency:     currency,
  status:       z.enum(['borrador', 'aprobado', 'pagado', 'anulado']).optional(),
  payment_date: optionalDateStr,
  notes:        z.string().max(2000).optional().nullable(),
})

export const PayrollUpdateSchema = PayrollCreateSchema.partial()

export const PayrollStatusSchema = z.object({
  status: z.enum(['borrador', 'aprobado', 'pagado', 'anulado']),
})

// ─────────────────────────────────────────────────────────────────────────────
// COMBUSTIBLE (fuel_records)
// ─────────────────────────────────────────────────────────────────────────────

export const FuelCreateSchema = z.object({
  vehicle_id:   uuid,
  driver_id:    optionalUuid,
  date:         dateStr,
  liters:       z.coerce.number().positive('Litros deben ser mayor a 0'),
  cost:         positiveNumber,
  currency:     currency,
  odometer:     positiveNumber.optional().nullable(),
  station_name: z.string().max(200).optional().nullable(),
  notes:        z.string().max(1000).optional().nullable(),
})

export const FuelUpdateSchema = FuelCreateSchema.partial()

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES (clients)
// ─────────────────────────────────────────────────────────────────────────────

export const ClientCreateSchema = z.object({
  name:           z.string().min(2).max(200),
  rif:            z.string().max(20).optional().nullable(),
  address:        z.string().max(500).optional().nullable(),
  contact_person: z.string().max(150).optional().nullable(),
  email:          z.string().email('Email inválido').optional().nullable(),
  phone:          z.string().max(30).optional().nullable(),
  status:         z.enum(['active', 'inactive']).optional(),
})

export const ClientUpdateSchema = ClientCreateSchema.partial()

// ─────────────────────────────────────────────────────────────────────────────
// CONTRATOS (contracts)
// ─────────────────────────────────────────────────────────────────────────────

export const ContractCreateSchema = z.object({
  client_id:    uuid,
  contract_num: z.string().min(2).max(50),
  title:        z.string().min(3).max(300),
  description:  z.string().max(2000).optional().nullable(),
  start_date:   optionalDateStr,
  end_date:     optionalDateStr,
  amount:       positiveNumber.optional(),
  currency:     currency.optional(),
  status:       z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  file_url:     z.string().url().optional().nullable(),
})

export const ContractUpdateSchema = ContractCreateSchema.partial()

// ─────────────────────────────────────────────────────────────────────────────
// INVENTARIO (inventory_items)
// ─────────────────────────────────────────────────────────────────────────────

export const InventoryCreateSchema = z.object({
  name:         z.string().min(2).max(255),
  sku:          z.string().max(50).optional().nullable(),
  category:     z.enum(['repuesto', 'herramienta', 'consumible', 'equipo', 'otro']),
  unit:         z.string().max(50).optional(),
  quantity:     positiveNumber,
  min_quantity: positiveNumber.optional(),
  unit_cost:    positiveNumber,
  currency:     currency.optional(),
  location:     z.string().max(255).optional().nullable(),
  notes:        z.string().max(2000).optional().nullable(),
})

export const InventoryUpdateSchema = InventoryCreateSchema.partial()

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN — Gestión de Usuarios
// ─────────────────────────────────────────────────────────────────────────────

export const InviteUserSchema = z.object({
  email:     z.string().email('Email inválido'),
  full_name: z.string().min(3).max(150),
  role:      z.enum(['admin', 'dispatcher', 'driver', 'finance']),
  phone_number: z.string().max(20).optional().nullable(),
})

export const UpdateUserProfileSchema = z.object({
  full_name:    z.string().min(3).max(150).optional(),
  phone_number: z.string().max(20).optional().nullable(),
  role:         z.enum(['admin', 'dispatcher', 'driver', 'finance']).optional(),
  is_active:    z.boolean().optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// UUID sencillo para acciones de borrado
// ─────────────────────────────────────────────────────────────────────────────

export const IdSchema = z.object({ id: uuid })
