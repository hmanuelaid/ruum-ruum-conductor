import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError, requireDriverOrAdmin } from '@/lib/api-auth'
import { parseTripPatch, readJsonObject } from '@/lib/api-validation'

const TRIP_DETAIL_COLUMNS = [
  'id',
  'status',
  'driver_id',
  'vehicle_brand',
  'vehicle_model',
  'vehicle_year',
  'vehicle_color',
  'vehicle_plates',
  'vehicle_condition',
  'origin_address',
  'origin_reference',
  'origin_contact_name',
  'origin_contact_phone',
  'destination_address',
  'destination_reference',
  'dest_contact_name',
  'dest_contact_phone',
  'driver_pay_mxn',
  'distance_km',
  'created_at',
].join(',')

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const forbidden = requireDriverOrAdmin(auth.context)
  if (forbidden) return forbidden

  let query = auth.context.supabase
    .from('trips')
    .select(TRIP_DETAIL_COLUMNS)
    .eq('id', id)

  if (!auth.context.isAdmin) {
    query = query.eq('driver_id', auth.context.driverId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) return jsonError('Could not load trip.', 500)
  if (!data) return jsonError('Trip not found.', 404)

  return NextResponse.json({ ok: true, data })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const forbidden = requireDriverOrAdmin(auth.context)
  if (forbidden) return forbidden

  const body = await readJsonObject(req)
  if (!body.ok) return jsonError(body.error, 400)

  const parsed = parseTripPatch(body.value)
  if (!parsed.ok) return jsonError(parsed.error, 400)

  let query = auth.context.supabase
    .from('trips')
    .update({ status: parsed.value.status })
    .eq('id', id)
    .select(TRIP_DETAIL_COLUMNS)

  if (!auth.context.isAdmin) {
    query = query.eq('driver_id', auth.context.driverId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) return jsonError('Could not update trip.', 500)
  if (!data) return jsonError('Trip not found.', 404)

  return NextResponse.json({ ok: true, data })
}
