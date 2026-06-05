import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import { readJsonObject } from '@/lib/api-validation'

const VALID_STATUSES = new Set(['disponible', 'no_disponible', 'en_viaje', 'pausado'])

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .select('id, availability_status')
    .eq('id', auth.context.driverId)
    .maybeSingle()

  if (error) return jsonError('Could not load availability.', 500)
  if (!data) return jsonError('Driver not found.', 404)

  return NextResponse.json({
    ok: true,
    data: { available: data.availability_status === 'disponible', status: data.availability_status ?? 'no_disponible' },
  })
}

export async function PATCH(req: Request) {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const body = await readJsonObject(req)
  if (!body.ok) return jsonError(body.error, 400)

  const status = typeof body.value.status === 'string' ? body.value.status : null

  if (!status || !VALID_STATUSES.has(status)) {
    return jsonError('Invalid availability status.', 400)
  }

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .update({ availability_status: status })
    .eq('id', auth.context.driverId)
    .select('id, availability_status')
    .maybeSingle()

  if (error) return jsonError('Could not update availability.', 500)
  if (!data) return jsonError('Driver not found.', 404)

  return NextResponse.json({
    ok: true,
    data: { available: data.availability_status === 'disponible', status: data.availability_status },
  })
}
