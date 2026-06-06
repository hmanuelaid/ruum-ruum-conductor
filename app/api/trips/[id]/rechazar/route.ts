import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import { updateDriverAvailabilityBestEffort } from '@/lib/driver-availability'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getApiAuthContext(req, 'trips')
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  // Puede ocultar localmente una oferta sin asignar, o liberar un viaje recien asignado a el.
  const { data: trip, error: fetchError } = await auth.context.supabase
    .from('trips')
    .select('id, status, driver_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return jsonError('Could not load trip.', 500)
  if (!trip) return jsonError('Trip not found.', 404)

  if (trip.status === 'pendiente_asignacion' && !trip.driver_id) {
    return NextResponse.json({ ok: true })
  }

  if (trip.status !== 'conductor_asignado' || trip.driver_id !== auth.context.driverId) {
    return jsonError('Trip cannot be rejected in its current state.', 409)
  }

  const { error } = await auth.context.supabase
    .from('trips')
    .update({ status: 'pendiente_asignacion', driver_id: null })
    .eq('id', id)
    .eq('status', 'conductor_asignado')
    .eq('driver_id', auth.context.driverId)

  if (error) return jsonError('Could not reject trip.', 500)

  await updateDriverAvailabilityBestEffort(
    auth.context.supabase,
    'rechazar',
    auth.context.driverId,
    id,
    'disponible'
  )

  return NextResponse.json({ ok: true })
}
