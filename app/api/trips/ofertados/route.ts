import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'

const OFFERED_COLUMNS = [
  'id', 'status',
  'vehicle_brand', 'vehicle_model', 'vehicle_year', 'vehicle_color',
  'vehicle_plates',
  'origin_address', 'origin_reference',
  'destination_address', 'destination_reference',
  'driver_pay_mxn', 'distance_km',
  'created_at',
].join(',')

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const { data, error } = await auth.context.supabase
    .from('trips')
    .select(OFFERED_COLUMNS)
    .eq('status', 'pendiente_asignacion')
    .is('driver_id', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Could not load offered trips:', error)
    return jsonError('Could not load offered trips.', 500)
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}
