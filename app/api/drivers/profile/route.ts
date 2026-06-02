import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import { readJsonObject } from '@/lib/api-validation'

type DriverProfilePayload = {
  name: string
  phone?: string
  email?: string
}

function parseDriverProfile(body: Record<string, unknown>): DriverProfilePayload | string {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''

  if (!name) return 'Driver name is required.'

  return { name, phone, email }
}

export async function POST(req: Request) {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const body = await readJsonObject(req)
  if (!body.ok) return jsonError(body.error, 400)

  const parsed = parseDriverProfile(body.value)
  if (typeof parsed === 'string') return jsonError(parsed, 400)

  const email = auth.context.user.email ?? parsed.email
  if (!email) return jsonError('Driver email is required.', 400)

  const { data: existing, error: lookupError } = await auth.context.supabase
    .from('drivers')
    .select('id, name, phone, email')
    .eq('auth_id', auth.context.user.id)
    .maybeSingle()

  if (lookupError) return jsonError('Could not verify driver profile.', 500)

  if (existing) {
    return NextResponse.json({ ok: true, data: existing })
  }

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .insert({
      auth_id: auth.context.user.id,
      name: parsed.name,
      phone: parsed.phone ?? '',
      email,
      status: 'pendiente_validacion',
    })
    .select('id, name, phone, email')
    .maybeSingle()

  if (error || !data) return jsonError('Could not create driver profile.', 500)

  return NextResponse.json({ ok: true, data })
}
