import type { TripFlowStatus } from '@/lib/types'

export {
  getRequiredEvidenceForTransition,
  isAllowedTripTransition,
  isTripEvidenceType,
  TRIP_EVIDENCE_STATUS,
  TRIP_NEXT_STATUS,
  TRIP_REQUIRED_EVIDENCE,
  TRIP_STATUS_REQUIRED_EVIDENCE,
  type TripEvidenceType,
} from '@ruum/types'

export const TRIP_FLOW_STATUSES = [
  'conductor_asignado',
  'conductor_en_camino',
  'recoleccion_proceso',
  'evidencia_inicial_pendiente',
  'traslado_curso',
  'entrega_proceso',
  'evidencia_final_pendiente',
  'finalizado',
] as const satisfies readonly TripFlowStatus[]

export const TRIP_PATCH_STATUSES = [
  'pendiente_asignacion',
  ...TRIP_FLOW_STATUSES,
  'cancelado',
] as const

export function isTripPatchStatus(status: unknown): status is typeof TRIP_PATCH_STATUSES[number] {
  return typeof status === 'string' && (TRIP_PATCH_STATUSES as readonly string[]).includes(status)
}
