import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getApiAuthContext, jsonError, requireDriverOrAdmin } from '@/lib/api-auth'
import { parseTripPatch, readJsonObject } from '@/lib/api-validation'
import type { TripDetail, TripFlowStatus } from '@/lib/types'
import {
  getRequiredEvidenceForTransition,
  isAllowedTripTransition,
} from '@/lib/trip-flow'

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

async function appendEvidenceFlags(
  supabase: SupabaseClient,
  trip: TripDetail
): Promise<TripDetail> {
  const { data, error } = await supabase
    .from('trip_evidence')
    .select('type')
    .eq('trip_id', trip.id)
    .in('type', ['pickup', 'delivery'])

  if (error) {
    return {
      ...trip,
      has_pickup_evidence: false,
      has_delivery_evidence: false,
    }
  }

  const evidenceTypes = new Set((data ?? []).map(item => item.type))
  return {
    ...trip,
    has_pickup_evidence: evidenceTypes.has('pickup'),
    has_delivery_evidence: evidenceTypes.has('delivery'),
  }
}

async function hasRequiredEvidence(
  supabase: SupabaseClient,
  tripId: string,
  type: 'pickup' | 'delivery'
) {
  const { count, error } = await supabase
    .from('trip_evidence')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('type', type)

  if (error) return false
  return (count ?? 0) > 0
}

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
  const trip = data as unknown as TripDetail

  return NextResponse.json({
    ok: true,
    data: await appendEvidenceFlags(auth.context.supabase, trip),
  })
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

  let currentQuery = auth.context.supabase
    .from('trips')
    .select(TRIP_DETAIL_COLUMNS)
    .eq('id', id)

  if (!auth.context.isAdmin) {
    currentQuery = currentQuery.eq('driver_id', auth.context.driverId)
  }

  const { data: currentTrip, error: currentError } = await currentQuery.maybeSingle()
  if (currentError) return jsonError('Could not load trip.', 500)
  if (!currentTrip) return jsonError('Trip not found.', 404)
  const current = currentTrip as unknown as TripDetail

  const currentStatus = current.status
  const nextStatus = parsed.value.status as TripFlowStatus

  if (parsed.value.status === 'cancelado' && !auth.context.isAdmin) {
    return jsonError('Only admins can cancel trips from this endpoint.', 403)
  }

  const adminCancel = parsed.value.status === 'cancelado' && auth.context.isAdmin
  if (!adminCancel && !isAllowedTripTransition(currentStatus, nextStatus)) {
    return jsonError('Invalid trip status transition.', 409)
  }

  const requiredEvidence = adminCancel
    ? null
    : getRequiredEvidenceForTransition(currentStatus, nextStatus)

  if (requiredEvidence) {
    const evidenceExists = await hasRequiredEvidence(auth.context.supabase, id, requiredEvidence)
    if (!evidenceExists) {
      return jsonError('Required trip evidence is missing.', 409)
    }
  }

  let query = auth.context.supabase
    .from('trips')
    .update({ status: parsed.value.status })
    .eq('id', id)
    .eq('status', current.status)
    .select(TRIP_DETAIL_COLUMNS)

  if (!auth.context.isAdmin) {
    query = query.eq('driver_id', auth.context.driverId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) return jsonError('Could not update trip.', 500)
  if (!data) return jsonError('Trip status changed. Refresh and try again.', 409)
  const updated = data as unknown as TripDetail

  if (['finalizado', 'cancelado'].includes(updated.status) && updated.driver_id) {
    await auth.context.supabase
      .from('drivers')
      .update({ availability_status: 'disponible' })
      .eq('id', updated.driver_id)
  }

  return NextResponse.json({
    ok: true,
    data: await appendEvidenceFlags(auth.context.supabase, updated),
  })
}
