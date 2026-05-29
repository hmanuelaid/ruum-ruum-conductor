// ─── Driver ───────────────────────────────────────────────────────────────────
export interface Driver {
  id: string
  name: string
  avatar: string // initials
  rating: number
  certified: boolean
  available: boolean
}

// ─── Trip ─────────────────────────────────────────────────────────────────────
export type TripStatus = 'active' | 'completed' | 'closed' | 'cancelled'

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
export type MovementType = 'trip' | 'bonus' | 'deposit'

export interface Movement {
  id: string
  type: MovementType
  label: string
  sublabel: string
  dateLabel: string
  amountMXN: number // negative = outgoing
}

export interface EarningsSummary {
  availableMXN: number
  payoutDay: string
  weekTrips: number
  weekEarningsMXN: number
  nextPayoutLabel: string
  movements: Movement[]
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