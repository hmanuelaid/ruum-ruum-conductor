// ─── app/api/trips/[id]/route.ts ──────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { mockTrips } from '@/lib/mock-data'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const trip = mockTrips.find(t => t.id === params.id)
  if (!trip) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, data: trip })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  // TODO: update trip status in DB
  return NextResponse.json({ ok: true, data: { id: params.id, ...body } })
}
