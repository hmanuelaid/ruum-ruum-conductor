// ─── Driver ───────────────────────────────────────────────────────────────────
import type { TripStatus } from '@ruum/types'
export type { TripStatus } from '@ruum/types'

export interface Driver {
  id: string
  name: string
  avatar: string // initials
  rating: number
  certified: boolean
  available: boolean
}

// ─── Trip ─────────────────────────────────────────────────────────────────────
export interface TripStop {
  label: string
  address: string
}

export interface Trip {
  id: string
  status: TripStatus
  origin: TripStop
  destination: TripStop
  etaMin: number
  estimatedMXN: number
  distanceKm: number
  date: string // ISO
}

// ─── Earnings ─────────────────────────────────────────────────────────────────
export type MovementType = 'trip' | 'bonus' | 'deposit' | 'adjustment' | 'expense'

export interface Movement {
  id: string
  type: MovementType
  label: string
  sublabel: string
  dateLabel: string
  amountMXN: number // negative = outgoing/expense
}

export interface WeekSummary {
  weekLabel: string        // e.g. "02 Jun – 08 Jun"
  weekStart: string        // ISO date
  tripsCount: number
  grossMXN: number         // total earned from trips
  expensesMXN: number      // authorized expenses (negative)
  adjustmentsMXN: number   // bonuses or deductions
  netMXN: number           // gross + adjustments - expenses
  payoutStatus: 'pendiente' | 'procesando' | 'depositado'
  payoutDateLabel: string  // e.g. "Vie 13 Jun · 14:00–18:00"
}

export interface EarningsSummary {
  availableMXN: number
  totalLifetimeMXN: number
  payoutDay: string
  weekTrips: number
  weekEarningsMXN: number
  weekExpensesMXN: number
  weekAdjustmentsMXN: number
  weekNetMXN: number
  nextPayoutLabel: string
  nextPayoutDateISO: string
  totalKm: number
  movements: Movement[]
  weekHistory: WeekSummary[]
}

// ─── Driver Trip Preferences ─────────────────────────────────────────────────
export type DriverShiftPreference = 'manana' | 'tarde' | 'noche' | 'mixto'

export interface DriverTripPreferences {
  preferred_zones: string[]
  max_trip_distance_km: number
  minimum_trip_pay_mxn: number
  preferred_shift: DriverShiftPreference
  accepts_long_distance: boolean
}

// ─── Driver Account Settings ─────────────────────────────────────────────────
export interface DriverAccountSettings {
  name: string
  phone: string
  email: string
  bank_name: string
  bank_account_holder: string
  bank_clabe: string
}

// ─── Trip Detail (viaje aceptado con datos completos) ─────────────────────────
export type TripFlowStatus =
  | 'conductor_asignado'
  | 'conductor_en_camino'
  | 'recoleccion_proceso'
  | 'evidencia_inicial_pendiente'
  | 'traslado_curso'
  | 'entrega_proceso'
  | 'evidencia_final_pendiente'
  | 'finalizado'
  | 'cancelado'

export interface TripDetail {
  id: string
  status: TripFlowStatus
  driver_id: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_year: number | null
  vehicle_color: string | null
  vehicle_plates: string | null
  vehicle_condition: string | null
  origin_address: string | null
  origin_reference: string | null
  origin_contact_name: string | null
  origin_contact_phone: string | null
  destination_address: string | null
  destination_reference: string | null
  dest_contact_name: string | null
  dest_contact_phone: string | null
  driver_pay_mxn: number | null
  distance_km: number | null
  created_at: string
  has_pickup_evidence?: boolean
  has_delivery_evidence?: boolean
}

// ─── Documents ────────────────────────────────────────────────────────────────
export type DocumentStatus = 'approved' | 'review' | 'pending'

export interface DriverDocument {
  id: string
  name: string
  status: DocumentStatus
}

// ─── Notifications / Alerts ───────────────────────────────────────────────────
export type AlertSeverity = 'warning' | 'info' | 'danger'

export interface OperativeAlert {
  id: string
  severity: AlertSeverity
  message: string
}

// ─── API response wrapper ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  ok: boolean
  error?: string
}
