import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  // Solo puede rechazar viajes ofertados (sin driver asignado) o asignados a él
  const { data: trip, error: fetchError } = await auth.context.supabase
    .from('trips')
    .select('id, status, driver_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return jsonError('Could not load trip.', 500)
  if (!trip) return jsonError('Trip not found.', 404)

  const canReject =
    trip.status === 'ofertado' ||
    (trip.status === 'conductor_asignado' && trip.driver_id === auth.context.driverId)

  if (!canReject) return jsonError('Trip cannot be rejected in its current state.', 409)

  // Si era asignado a este conductor, regresamos a 'pendiente_asignacion'
  const newStatus = trip.status === 'conductor_asignado' ? 'pendiente_asignacion' : 'ofertado'

  const updatePayload =
    trip.driver_id === auth.context.driverId
      ? { status: newStatus, driver_id: null }
      : { status: newStatus }

  const { error } = await auth.context.supabase
    .from('trips')
    .update(updatePayload)
    .eq('id', id)

  if (error) return jsonError('Could not reject trip.', 500)

  return NextResponse.json({ ok: true })
}
