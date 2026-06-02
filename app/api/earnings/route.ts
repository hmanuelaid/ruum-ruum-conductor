// ─── app/api/earnings/route.ts ────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) {
    return jsonError('Driver profile required.', 403)
  }

  const { data, error } = await auth.context.supabase
    .from('trips')
    .select('id,status,driver_pay_mxn,distance_km,origin_address,destination_address,created_at')
    .eq('driver_id', auth.context.driverId)
    .order('created_at', { ascending: false })

  if (error) return jsonError('Could not load earnings.', 500)

  const trips = data ?? []
  const finalized = trips.filter(trip => trip.status === 'finalizado')
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  const weekTrips = finalized.filter(trip => new Date(trip.created_at) >= weekStart)
  const weekEarningsMXN = weekTrips.reduce((sum, trip) => sum + Number(trip.driver_pay_mxn ?? 0), 0)
  const availableMXN = finalized.reduce((sum, trip) => sum + Number(trip.driver_pay_mxn ?? 0), 0)

  return NextResponse.json({
    ok: true,
    data: {
      availableMXN,
      payoutDay: 'viernes',
      weekTrips: weekTrips.length,
      weekEarningsMXN,
      nextPayoutLabel: 'Vie · 14:00 - 18:00',
      movements: finalized.slice(0, 10).map(trip => ({
        id: trip.id,
        type: 'trip',
        label: `Viaje ${trip.id}`,
        sublabel: trip.destination_address ?? 'Destino no disponible',
        dateLabel: new Date(trip.created_at).toLocaleDateString('es-MX'),
        amountMXN: Number(trip.driver_pay_mxn ?? 0),
      })),
    },
  })
}
