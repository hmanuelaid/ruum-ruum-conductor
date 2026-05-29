import { NextResponse } from 'next/server'
import { mockDocuments } from '@/lib/mock-data'
import type { ApiResponse, DriverDocument } from '@/lib/types'

export async function GET() {
  const res: ApiResponse<DriverDocument[]> = { data: mockDocuments, ok: true }
  return NextResponse.json(res)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  // TODO: validate, update DB, trigger re-validation workflow
  return NextResponse.json({ ok: true, data: body })
}