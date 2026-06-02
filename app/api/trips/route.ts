import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError, requireAdmin, requireDriverOrAdmin } from '@/lib/api-auth'

const TRIP_LIST_COLUMNS = [
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

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const forbidden = requireDriverOrAdmin(auth.context)
  if (forbidden) return forbidden

  let query = auth.context.supabase
    .from('trips')
    .select(TRIP_LIST_COLUMNS)
    .order('created_at', { ascending: false })

  if (!auth.context.isAdmin) {
    query = query.eq('driver_id', auth.context.driverId)
  }

  const { data, error } = await query
  if (error) return jsonError('Could not load trips.', 500)

  return NextResponse.json({ ok: true, data })
}

export async function POST() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const forbidden = requireAdmin(auth.context)
  if (forbidden) return forbidden

  return jsonError('Trip creation is not implemented yet.', 501)
}
