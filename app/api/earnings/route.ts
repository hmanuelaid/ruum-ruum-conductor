// ─── app/api/earnings/route.ts ────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { mockEarnings } from '@/lib/mock-data'
import type { ApiResponse, EarningsSummary } from '@/lib/types'

export async function GET() {
  const res: ApiResponse<EarningsSummary> = { data: mockEarnings, ok: true }
  return NextResponse.json(res)
}
