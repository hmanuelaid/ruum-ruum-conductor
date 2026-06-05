// ─── app/api/earnings/route.ts ────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import type { EarningsSummary, Movement, WeekSummary, MovementType } from '@/lib/types'

// Helper: get monday of the week for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper: format date range label "02 Jun – 08 Jun"
function weekLabel(start: Date): string {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

// Helper: next friday label
function nextFridayLabel(): { label: string; iso: string } {
  const now = new Date()
  const day = now.getDay()
  const daysUntilFriday = day <= 5 ? 5 - day : 7 - day + 5
  const friday = new Date(now)
  friday.setDate(now.getDate() + daysUntilFriday)
  const label = friday.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
  return {
    label: `${label} · 14:00–18:00`,
    iso: friday.toISOString().split('T')[0],
  }
}

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  if (!auth.context.driverId) {
    return jsonError('Driver profile required.', 403)
  }

  const supabase = auth.context.supabase
  const driverId = auth.context.driverId

  // Load all finalized trips for this driver
  const { data: tripsData, error: tripsError } = await supabase
    .from('trips')
    .select(
      'id,status,driver_pay_mxn,distance_km,origin_address,destination_address,created_at,updated_at'
    )
    .eq('driver_id', driverId)
    .eq('status', 'finalizado')
    .order('created_at', { ascending: false })

  if (tripsError) return jsonError('Could not load earnings.', 500)

  // Load payments for this driver (bonuses, deposits, adjustments)
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('id,amount,status,type,created_at,notes')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })

  const trips = tripsData ?? []
  const payments = paymentsData ?? []

  // ── Current week bounds ─────────────────────────────────────────────────────
  const now = new Date()
  const currentWeekStart = getWeekStart(now)
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 7)

  const weekTrips = trips.filter(t => {
    const d = new Date(t.created_at)
    return d >= currentWeekStart && d < currentWeekEnd
  })

  const weekEarnings = weekTrips.reduce((s, t) => s + Number(t.driver_pay_mxn ?? 0), 0)

  // Expenses & adjustments from payments table (current week)
  const weekPayments = payments.filter(p => {
    const d = new Date(p.created_at)
    return d >= currentWeekStart && d < currentWeekEnd
  })
  const weekExpenses = weekPayments
    .filter(p => p.type === 'expense')
    .reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const weekAdjustments = weekPayments
    .filter(p => p.type === 'adjustment' || p.type === 'bonus')
    .reduce((s, p) => s + Number(p.amount ?? 0), 0)

  const weekNet = weekEarnings - weekExpenses + weekAdjustments

  // ── Lifetime totals ─────────────────────────────────────────────────────────
  const totalLifetime = trips.reduce((s, t) => s + Number(t.driver_pay_mxn ?? 0), 0)
  const totalKm = trips.reduce((s, t) => s + Number(t.distance_km ?? 0), 0)
  const availableMXN = weekNet // pending payout = current week net

  // ── Build movements list (last 20) ──────────────────────────────────────────
  const tripMovements: Movement[] = trips.slice(0, 15).map(t => ({
    id: t.id,
    type: 'trip' as MovementType,
    label: `Viaje completado`,
    sublabel: `${t.origin_address?.split(',')[0] ?? '—'} → ${t.destination_address?.split(',')[0] ?? '—'}`,
    dateLabel: new Date(t.created_at).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    }),
    amountMXN: Number(t.driver_pay_mxn ?? 0),
  }))

  const paymentMovements: Movement[] = payments.slice(0, 10).map(p => ({
    id: p.id,
    type: (p.type === 'bonus'
      ? 'bonus'
      : p.type === 'expense'
      ? 'expense'
      : p.type === 'deposit'
      ? 'deposit'
      : 'adjustment') as MovementType,
    label:
      p.type === 'bonus'
        ? 'Bono aplicado'
        : p.type === 'expense'
        ? 'Gasto autorizado'
        : p.type === 'deposit'
        ? 'Depósito realizado'
        : 'Ajuste',
    sublabel: p.notes ?? '',
    dateLabel: new Date(p.created_at).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    }),
    amountMXN:
      p.type === 'expense'
        ? -Math.abs(Number(p.amount ?? 0))
        : Number(p.amount ?? 0),
  }))

  // Merge and sort movements by date
  const allMovements: Movement[] = [...tripMovements, ...paymentMovements]
    .sort((a, b) => b.dateLabel.localeCompare(a.dateLabel))
    .slice(0, 20)

  // ── Build weekly history (last 8 weeks) ────────────────────────────────────
  const weekHistory: WeekSummary[] = []
  for (let w = 0; w < 8; w++) {
    const wStart = new Date(currentWeekStart)
    wStart.setDate(wStart.getDate() - w * 7)
    const wEnd = new Date(wStart)
    wEnd.setDate(wEnd.getDate() + 7)

    const wTrips = trips.filter(t => {
      const d = new Date(t.created_at)
      return d >= wStart && d < wEnd
    })
    const wPayments = payments.filter(p => {
      const d = new Date(p.created_at)
      return d >= wStart && d < wEnd
    })

    const gross = wTrips.reduce((s, t) => s + Number(t.driver_pay_mxn ?? 0), 0)
    const expenses = wPayments
      .filter(p => p.type === 'expense')
      .reduce((s, p) => s + Number(p.amount ?? 0), 0)
    const adjustments = wPayments
      .filter(p => p.type === 'adjustment' || p.type === 'bonus')
      .reduce((s, p) => s + Number(p.amount ?? 0), 0)
    const net = gross - expenses + adjustments

    // Friday of the week = payout day
    const friday = new Date(wStart)
    friday.setDate(friday.getDate() + 4)
    const fridayIsPast = friday < now

    // Find if there's a deposit payment that week
    const hasDeposit = wPayments.some(p => p.type === 'deposit')

    const payoutStatus =
      w === 0
        ? 'pendiente'
        : hasDeposit
        ? 'depositado'
        : fridayIsPast
        ? 'procesando'
        : 'pendiente'

    weekHistory.push({
      weekLabel: weekLabel(wStart),
      weekStart: wStart.toISOString().split('T')[0],
      tripsCount: wTrips.length,
      grossMXN: gross,
      expensesMXN: expenses,
      adjustmentsMXN: adjustments,
      netMXN: net,
      payoutStatus,
      payoutDateLabel: friday.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }) + ' · 14:00–18:00',
    })
  }

  const nextPayout = nextFridayLabel()

  const summary: EarningsSummary = {
    availableMXN,
    totalLifetimeMXN: totalLifetime,
    payoutDay: 'viernes',
    weekTrips: weekTrips.length,
    weekEarningsMXN: weekEarnings,
    weekExpensesMXN: weekExpenses,
    weekAdjustmentsMXN: weekAdjustments,
    weekNetMXN: weekNet,
    nextPayoutLabel: nextPayout.label,
    nextPayoutDateISO: nextPayout.iso,
    totalKm,
    movements: allMovements,
    weekHistory,
  }

  return NextResponse.json({ ok: true, data: summary })
}
