import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import { updateDriverAvailabilityBestEffort } from '@/lib/driver-availability'

const TRIP_COLUMNS = [
  'id', 'status', 'driver_id',
  'vehicle_brand', 'vehicle_model', 'vehicle_year', 'vehicle_color',
  'vehicle_plates', 'vehicle_condition',
  'origin_address', 'origin_reference', 'origin_contact_name', 'origin_contact_phone',
  'destination_address', 'destination_reference', 'dest_contact_name', 'dest_contact_phone',
  'driver_pay_mxn', 'distance_km',
  'created_at',
].join(',')

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getApiAuthContext(req, 'trips')
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  // Verificar que el viaje esté pendiente de asignación y sin conductor asignado
  const { data: trip, error: fetchError } = await auth.context.supabase
    .from('trips')
    .select('id, status, driver_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('Could not load offered trip:', fetchError)
    return jsonError('Could not load trip.', 500)
  }
  if (!trip) return jsonError('Trip not found.', 404)
  if (trip.status !== 'pendiente_asignacion') return jsonError('Trip is no longer available.', 409)
  if (trip.driver_id && trip.driver_id !== auth.context.driverId) {
    return jsonError('Trip already assigned to another driver.', 409)
  }

  const { data, error } = await auth.context.supabase
    .from('trips')
    .update({ status: 'conductor_asignado', driver_id: auth.context.driverId })
    .eq('id', id)
    .eq('status', 'pendiente_asignacion') // optimistic lock
    .select(TRIP_COLUMNS)
    .maybeSingle()

  if (error) {
    console.error('Could not accept trip:', error)
    return jsonError('Could not accept trip.', 500)
  }
  if (!data) return jsonError('Trip no longer available.', 409)

  await updateDriverAvailabilityBestEffort(
    auth.context.supabase,
    'aceptar',
    auth.context.driverId,
    id,
    'en_viaje'
  )

  return NextResponse.json({ ok: true, data })
}
