// ─── app/api/trips/route.ts ───────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { mockTrips } from '@/lib/mock-data'
import type { ApiResponse, Trip } from '@/lib/types'

export async function GET() {
  const res: ApiResponse<Trip[]> = { data: mockTrips, ok: true }
  return NextResponse.json(res)
}

// POST: create / update trip (stub – connect your DB here)
export async function POST(req: Request) {
  const body = await req.json()
  // TODO: validate with zod, persist to DB
  console.log('POST /api/trips', body)
  return NextResponse.json({ ok: true, data: body })
}
