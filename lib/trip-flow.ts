import type { TripFlowStatus } from '@/lib/types'

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

export type TripEvidenceType = 'pickup' | 'delivery'

export const TRIP_NEXT_STATUS: Partial<Record<TripFlowStatus, TripFlowStatus>> = {
  conductor_asignado: 'conductor_en_camino',
  conductor_en_camino: 'recoleccion_proceso',
  recoleccion_proceso: 'evidencia_inicial_pendiente',
  evidencia_inicial_pendiente: 'traslado_curso',
  traslado_curso: 'entrega_proceso',
  entrega_proceso: 'evidencia_final_pendiente',
  evidencia_final_pendiente: 'finalizado',
}

export const TRIP_EVIDENCE_STATUS: Record<TripEvidenceType, TripFlowStatus> = {
  pickup: 'evidencia_inicial_pendiente',
  delivery: 'evidencia_final_pendiente',
}

export const TRIP_STATUS_REQUIRED_EVIDENCE: Partial<Record<TripFlowStatus, TripEvidenceType>> = {
  traslado_curso: 'pickup',
  finalizado: 'delivery',
}

export function isTripPatchStatus(status: unknown): status is typeof TRIP_PATCH_STATUSES[number] {
  return typeof status === 'string' && (TRIP_PATCH_STATUSES as readonly string[]).includes(status)
}

export function isTripEvidenceType(type: unknown): type is TripEvidenceType {
  return type === 'pickup' || type === 'delivery'
}

export function getRequiredEvidenceForTransition(
  currentStatus: TripFlowStatus,
  nextStatus: TripFlowStatus
) {
  if (TRIP_NEXT_STATUS[currentStatus] !== nextStatus) return null
  return TRIP_STATUS_REQUIRED_EVIDENCE[nextStatus] ?? null
}

export function isAllowedTripTransition(currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus) return true
  if (currentStatus === 'cancelado' || currentStatus === 'finalizado') return false
  return TRIP_NEXT_STATUS[currentStatus as TripFlowStatus] === nextStatus
}
