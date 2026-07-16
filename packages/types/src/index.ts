export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'finance';
export type VehicleType = 'truck' | 'heavy_machinery' | 'van' | 'pickup';
export type VehicleStatus = 'active' | 'in_maintenance' | 'inactive';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';
export type TripStatus = 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
export type TransactionType = 'income' | 'expense';
export type StopType = 'loading' | 'unloading';
export type Currency = 'USD' | 'EUR' | 'VES';

export interface Profile {
  id: string; // UUID
  role: UserRole;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  cedula_identidad?: string;
  licencia_tipo?: string;
  bank_account_number?: string | null; // Número de cuenta bancaria
  bank_name?: string | null;           // Nombre del banco
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string; // UUID
  plate_number: string;
  make: string;
  model: string;
  year?: number;
  type: VehicleType;
  capacity_kg?: number;
  status: VehicleStatus;
  current_mileage: number;
  rotc?: string; // Permiso ROTC
  current_lat?: number | null; // Coordenadas GPS (Latitud)
  current_lng?: number | null; // Coordenadas GPS (Longitud)
  last_location_update?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string; // UUID
  name: string;
  description?: string;
  location: string;
  client_name?: string;
  budget: number;
  currency: Currency;   // Moneda del presupuesto: USD | EUR | VES
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TripStop {
  id: string; // UUID
  trip_id: string; // UUID
  stop_order: number;       // 1, 2, 3... define el orden de la parada
  location: string;         // Nombre o dirección del punto de carga/descarga
  stop_type: StopType;      // loading | unloading
  notes?: string;
  arrived_at?: string;      // Hora real de llegada (registrada por el conductor)
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string; // UUID
  project_id?: string;      // UUID — Obra destino (null si es traslado interno)
  vehicle_id?: string;      // UUID
  driver_id?: string;       // UUID
  origin: string;
  destination: string;      // Destino final (generalmente la obra)
  distance_km?: number;
  status: TripStatus;
  departure_time?: string;
  arrival_time?: string;
  notes?: string;
  // Campos financieros del viaje
  precio_flete?: number | null;
  precio_currency?: string | null;
  bono_chofer?: number | null;
  bono_currency?: string | null;
  viaticos?: number | null;
  viaticos_currency?: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones cargadas por JOIN (Supabase select con expand)
  projects?: Pick<Project, 'id' | 'name' | 'location'> | null;
  vehicles?: Pick<Vehicle, 'plate_number' | 'make' | 'model'> | null;
  profiles?: Pick<Profile, 'full_name'> | null;
  trip_stops?: TripStop[];  // Paradas intermedias ordenadas por stop_order
}

export interface Transaction {
  id: string; // UUID
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  project_id?: string; // UUID
  trip_id?: string; // UUID
  vehicle_id?: string; // UUID
  created_by?: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string
  sku: string | null
  name: string
  category: 'repuesto' | 'herramienta' | 'consumible' | 'equipo' | 'otro'
  unit: string
  quantity: number
  min_quantity: number
  unit_cost: number
  currency: string
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
