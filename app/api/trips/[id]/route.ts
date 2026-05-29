import { NextResponse } from 'next/server'
import { mockTrips } from '@/lib/mock-data'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const trip = mockTrips.find(t => t.id === id)
  if (!trip) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, data: trip })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  return NextResponse.json({ ok: true, data: { id, ...body } })
}