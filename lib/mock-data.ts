import type {
  Driver,
  Trip,
  EarningsSummary,
  DriverDocument,
  OperativeAlert,
} from './types'

export const mockDriver: Driver = {
  id: 'drv-001',
  name: 'Carlos Ramírez',
  avatar: 'C',
  rating: 4.9,
  certified: true,
  available: true,
}

export const mockTrips: Trip[] = [
  {
    id: 'T-001245',
    status: 'active',
    origin: { label: 'Lugar inicio', address: 'Roma Norte, CDMX' },
    destination: { label: 'Lugar destino', address: 'Santa Fe, CDMX' },
    etaMin: 34,
    estimatedMXN: 680,
    distanceKm: 18.6,
    date: new Date().toISOString(),
  },
  {
    id: 'T-001239',
    status: 'completed',
    origin: { label: 'Lugar inicio', address: 'Polanco, CDMX' },
    destination: { label: 'Lugar destino', address: 'Condesa, CDMX' },
    etaMin: 28,
    estimatedMXN: 430,
    distanceKm: 9.2,
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'T-001233',
    status: 'closed',
    origin: { label: 'Lugar inicio', address: 'Coyoacán, CDMX' },
    destination: { label: 'Lugar destino', address: 'Reforma, CDMX' },
    etaMin: 41,
    estimatedMXN: 520,
    distanceKm: 14.1,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]

export const mockEarnings: EarningsSummary = {
  availableMXN: 8240,
  totalLifetimeMXN: 54600,
  payoutDay: 'viernes',
  weekTrips: 12,
  weekEarningsMXN: 8240,
  weekExpensesMXN: 0,
  weekAdjustmentsMXN: 300,
  weekNetMXN: 8540,
  nextPayoutLabel: 'Vie · 14:00–18:00',
  nextPayoutDateISO: '2025-06-13',
  totalKm: 3420,
  movements: [
    {
      id: 'mv-001',
      type: 'trip',
      label: 'Viaje completado',
      sublabel: 'Santa Fe → Polanco',
      dateLabel: 'Hoy',
      amountMXN: 680,
    },
    {
      id: 'mv-002',
      type: 'bonus',
      label: 'Bono puntualidad',
      sublabel: 'Semana activa',
      dateLabel: 'Ayer',
      amountMXN: 300,
    },
    {
      id: 'mv-003',
      type: 'deposit',
      label: 'Depósito realizado',
      sublabel: 'Cuenta terminación 4218',
      dateLabel: 'Viernes',
      amountMXN: 7860,
    },
  ],
  weekHistory: [],
}

export const mockDocuments: DriverDocument[] = [
  { id: 'doc-001', name: 'Licencia', status: 'approved' },
  { id: 'doc-002', name: 'Comprobante domicilio', status: 'review' },
  { id: 'doc-003', name: 'Constancia fiscal', status: 'pending' },
  { id: 'doc-004', name: 'Identificación oficial', status: 'approved' },
  { id: 'doc-005', name: 'CURP', status: 'pending' },
]

export const mockAlerts: OperativeAlert[] = [
  {
    id: 'alt-001',
    severity: 'warning',
    message: 'Tu constancia fiscal está pendiente de validación.',
  },
  {
    id: 'alt-002',
    severity: 'info',
    message: 'Recuerda cargar evidencia final al cerrar cada viaje.',
  },
]