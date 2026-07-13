/**
 * src/types/index.ts
 * Tipos TypeScript locales del módulo web, derivados del schema de BD.
 * Complementan los tipos del paquete @fleetcore/types con interfaces
 * específicas de módulos avanzados (Facturas, Nóminas, Mantenimiento, etc.)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Re-exportar desde el paquete compartido para uso conveniente
// ─────────────────────────────────────────────────────────────────────────────
export type {
  UserRole,
  VehicleType,
  VehicleStatus,
  ProjectStatus,
  TripStatus,
  Currency,
  Profile,
  Vehicle,
  Project,
  Trip,
  TripStop,
  Transaction,
  InventoryItem,
} from '@fleetcore/types'

// ─────────────────────────────────────────────────────────────────────────────
// Módulo de Facturación
// ─────────────────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'borrador' | 'emitida' | 'pagada' | 'cancelada'

export interface InvoiceItem {
  id:          string
  invoice_id:  string
  description: string
  quantity:    number
  unit_price:  number
  subtotal:    number     // GENERATED: quantity * unit_price
  created_at:  string
}

export interface Invoice {
  id:          string
  invoice_num: string      // FAC-2026-0001 (auto-generado por trigger)
  client_name: string
  client_rif?: string | null
  project_id?: string | null
  subtotal:    number
  tax_pct:     number      // IVA % (default 16)
  tax_amount:  number      // GENERATED: subtotal * tax_pct / 100
  total:       number      // GENERATED: subtotal + tax_amount
  currency:    string
  status:      InvoiceStatus
  issued_at?:  string | null
  due_at?:     string | null
  notes?:      string | null
  created_by?: string | null
  created_at:  string
  updated_at:  string
  // Relaciones
  invoice_items?: InvoiceItem[]
  projects?:      { name: string } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Módulo de Nóminas
// ─────────────────────────────────────────────────────────────────────────────

export type PayrollStatus = 'borrador' | 'aprobado' | 'pagado' | 'anulado'

export interface PayrollRecord {
  id:           string
  profile_id:   string
  period_start: string
  period_end:   string
  base_salary:  number
  bonuses:      number
  deductions:   number
  net_pay:      number    // GENERATED: base_salary + bonuses - deductions
  currency:     string
  status:       PayrollStatus
  payment_date?: string | null
  notes?:        string | null
  created_by?:   string | null
  created_at:    string
  updated_at:    string
  // Relaciones
  profiles?: {
    full_name:    string
    role:         string
    phone_number?: string | null
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Módulo de Mantenimiento
// ─────────────────────────────────────────────────────────────────────────────

export type MaintenanceType   = 'preventivo' | 'correctivo' | 'revision' | 'emergencia'
export type MaintenanceStatus = 'programado' | 'en_proceso' | 'completado' | 'cancelado'

export interface MaintenanceRecord {
  id:                 string
  vehicle_id:         string
  type:               MaintenanceType
  status:             MaintenanceStatus
  description:        string
  workshop?:          string | null
  cost:               number
  currency:           string
  mileage_at_service?: number | null
  scheduled_date:     string
  completed_date?:    string | null
  notes?:             string | null
  created_by?:        string | null
  created_at:         string
  updated_at:         string
  // Relaciones
  vehicles?: {
    plate_number: string
    make:         string
    model:        string
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Módulo de Combustible
// ─────────────────────────────────────────────────────────────────────────────

export interface FuelRecord {
  id:           string
  vehicle_id:   string
  driver_id?:   string | null
  date:         string
  liters:       number
  cost:         number
  currency:     string
  odometer?:    number | null
  station_name?: string | null
  notes?:        string | null
  created_by?:   string | null
  created_at:   string
  updated_at:   string
  // Relaciones
  vehicles?: { plate_number: string; make: string; model: string } | null
  profiles?:  { full_name: string } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Módulo de Clientes y Contratos
// ─────────────────────────────────────────────────────────────────────────────

export type ClientStatus   = 'active' | 'inactive'
export type ContractStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export interface Client {
  id:             string
  name:           string
  rif?:           string | null
  address?:       string | null
  contact_person?: string | null
  email?:         string | null
  phone?:         string | null
  status:         ClientStatus
  created_by?:    string | null
  created_at:     string
  updated_at:     string
}

export interface Contract {
  id:           string
  contract_num: string
  client_id:    string
  title:        string
  description?: string | null
  start_date?:  string | null
  end_date?:    string | null
  amount:       number
  currency:     string
  status:       ContractStatus
  file_url?:    string | null
  created_by?:  string | null
  created_at:   string
  updated_at:   string
  // Relaciones
  clients?: Pick<Client, 'name' | 'rif'> | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de paginación
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data:        T[]
  totalItems:  number
  totalPages:  number
  currentPage: number
  pageSize:    number
}

// ─────────────────────────────────────────────────────────────────────────────
// Respuesta estándar de Server Actions
// ─────────────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true;  data?: T; message?: string }
  | { success: false; error: string }
