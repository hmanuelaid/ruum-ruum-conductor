import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import { readJsonObject } from '@/lib/api-validation'
import type { DriverShiftPreference, DriverTripPreferences } from '@/lib/types'

const PREFERENCE_COLUMNS = [
  'preferred_zones',
  'max_trip_distance_km',
  'minimum_trip_pay_mxn',
  'preferred_shift',
  'accepts_long_distance',
].join(',')

const SHIFT_VALUES = new Set<DriverShiftPreference>(['manana', 'tarde', 'noche', 'mixto'])

const DEFAULT_PREFERENCES: DriverTripPreferences = {
  preferred_zones: [],
  max_trip_distance_km: 25,
  minimum_trip_pay_mxn: 350,
  preferred_shift: 'mixto',
  accepts_long_distance: true,
}

function normalizePreferences(value: Partial<DriverTripPreferences> | null): DriverTripPreferences {
  return {
    preferred_zones: Array.isArray(value?.preferred_zones)
      ? value.preferred_zones.filter(zone => typeof zone === 'string' && zone.trim()).map(zone => zone.trim()).slice(0, 8)
      : DEFAULT_PREFERENCES.preferred_zones,
    max_trip_distance_km: Number(value?.max_trip_distance_km ?? DEFAULT_PREFERENCES.max_trip_distance_km),
    minimum_trip_pay_mxn: Number(value?.minimum_trip_pay_mxn ?? DEFAULT_PREFERENCES.minimum_trip_pay_mxn),
    preferred_shift: SHIFT_VALUES.has(value?.preferred_shift as DriverShiftPreference)
      ? value?.preferred_shift as DriverShiftPreference
      : DEFAULT_PREFERENCES.preferred_shift,
    accepts_long_distance: typeof value?.accepts_long_distance === 'boolean'
      ? value.accepts_long_distance
      : DEFAULT_PREFERENCES.accepts_long_distance,
  }
}

function parsePreferences(body: Record<string, unknown>): DriverTripPreferences | string {
  const zones = body.preferred_zones
  const maxDistance = Number(body.max_trip_distance_km)
  const minimumPay = Number(body.minimum_trip_pay_mxn)
  const shift = body.preferred_shift
  const acceptsLongDistance = body.accepts_long_distance

  if (!Array.isArray(zones) || zones.some(zone => typeof zone !== 'string')) {
    return 'Preferred zones must be a string list.'
  }

  const cleanZones = zones
    .map(zone => zone.trim())
    .filter(Boolean)
    .slice(0, 8)

  if (!Number.isFinite(maxDistance) || maxDistance < 5 || maxDistance > 300) {
    return 'Maximum trip distance must be between 5 and 300 km.'
  }

  if (!Number.isFinite(minimumPay) || minimumPay < 0 || minimumPay > 10000) {
    return 'Minimum trip pay must be between 0 and 10000 MXN.'
  }

  if (!SHIFT_VALUES.has(shift as DriverShiftPreference)) {
    return 'Invalid shift preference.'
  }

  if (typeof acceptsLongDistance !== 'boolean') {
    return 'Long distance preference must be boolean.'
  }

  return {
    preferred_zones: cleanZones,
    max_trip_distance_km: Math.round(maxDistance),
    minimum_trip_pay_mxn: Math.round(minimumPay),
    preferred_shift: shift as DriverShiftPreference,
    accepts_long_distance: acceptsLongDistance,
  }
}

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response
  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .select(PREFERENCE_COLUMNS)
    .eq('id', auth.context.driverId)
    .maybeSingle()

  if (error) {
    console.error('Could not load driver preferences:', error)
    return jsonError('Could not load driver preferences.', 500)
  }
  if (!data) return jsonError('Driver not found.', 404)

  return NextResponse.json({
    ok: true,
    data: normalizePreferences(data as unknown as Partial<DriverTripPreferences>),
  })
}

export async function PATCH(req: Request) {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response
  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const body = await readJsonObject(req)
  if (!body.ok) return jsonError(body.error, 400)

  const parsed = parsePreferences(body.value)
  if (typeof parsed === 'string') return jsonError(parsed, 400)

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .update(parsed)
    .eq('id', auth.context.driverId)
    .select(PREFERENCE_COLUMNS)
    .maybeSingle()

  if (error) {
    console.error('Could not update driver preferences:', error)
    return jsonError('Could not update driver preferences.', 500)
  }
  if (!data) return jsonError('Driver not found.', 404)

  return NextResponse.json({
    ok: true,
    data: normalizePreferences(data as unknown as Partial<DriverTripPreferences>),
  })
}
