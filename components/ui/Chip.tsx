
// ─── components/ui/Chip.tsx ───────────────────────────────────────────────────
import type { TripStatus, DocumentStatus, AlertSeverity } from '@/lib/types'

type ChipVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const variantMap: Record<string, ChipVariant> = {
  active:    'warning',
  completed: 'success',
  closed:    'neutral',
  cancelled: 'danger',
  solicitud_recibida: 'info',
  pendiente_revision: 'warning',
  pendiente_asignacion: 'warning',
  conductor_asignado: 'info',
  conductor_en_camino: 'info',
  recoleccion_proceso: 'warning',
  evidencia_inicial_pendiente: 'warning',
  traslado_curso: 'info',
  entrega_proceso: 'warning',
  evidencia_final_pendiente: 'warning',
  finalizado: 'success',
  cancelado: 'danger',
  incidente: 'danger',
  approved:  'success',
  review:    'warning',
  pending:   'neutral',
  warning:   'warning',
  info:      'info',
  danger:    'danger',
}

interface ChipProps {
  variant?: ChipVariant
  status?: TripStatus | DocumentStatus | AlertSeverity | string
  children: React.ReactNode
}

export function Chip({ variant, status, children }: ChipProps) {
  const v = variant ?? (status ? variantMap[status] ?? 'neutral' : 'neutral')
  return <span className={`chip chip-${v}`}>{children}</span>
}
