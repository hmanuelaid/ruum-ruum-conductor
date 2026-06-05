import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'

const OFFERED_COLUMNS = [
  'id', 'status',
  'vehicle_brand', 'vehicle_model', 'vehicle_year', 'vehicle_color',
  'vehicle_plates', 'vehicle_transmission',
  'origin_address', 'origin_reference',
  'destination_address', 'destination_reference',
  'driver_pay_mxn', 'distance_km',
  'scheduled_at', 'service_type', 'special_instructions',
  'created_at',
].join(',')

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const { data, error } = await auth.context.supabase
    .from('trips')
    .select(OFFERED_COLUMNS)
    .eq('status', 'ofertado')
    .is('driver_id', null)
    .order('scheduled_at', { ascending: true })

  if (error) return jsonError('Could not load offered trips.', 500)

  return NextResponse.json({ ok: true, data: data ?? [] })
}
