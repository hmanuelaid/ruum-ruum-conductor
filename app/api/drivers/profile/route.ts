import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import { readJsonObject } from '@/lib/api-validation'

type DriverProfilePayload = {
  name: string
  phone?: string
  email?: string
}

const ONBOARDING_STATUSES = new Set(['documents_pending', 'submitted'])

function parseDriverProfile(body: Record<string, unknown>): DriverProfilePayload | string {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''

  if (!name) return 'Driver name is required.'

  return { name, phone, email }
}

function selectDriverProfile() {
  return 'id, name, phone, email, status'
}

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .select(selectDriverProfile())
    .eq('auth_id', auth.context.user.id)
    .maybeSingle()

  if (error) return jsonError('Could not load driver profile.', 500)
  if (!data) return jsonError('Driver profile not found.', 404)

  return NextResponse.json({ ok: true, data })
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
    .select(selectDriverProfile())
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
    .select(selectDriverProfile())
    .maybeSingle()

  if (error || !data) return jsonError('Could not create driver profile.', 500)

  return NextResponse.json({ ok: true, data })
}

export async function PATCH(req: Request) {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const body = await readJsonObject(req)
  if (!body.ok) return jsonError(body.error, 400)

  const onboardingStatus =
    typeof body.value.onboarding_status === 'string'
      ? body.value.onboarding_status.trim()
      : ''

  if (!ONBOARDING_STATUSES.has(onboardingStatus)) {
    return jsonError('Invalid onboarding status.', 400)
  }

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .select(selectDriverProfile())
    .eq('auth_id', auth.context.user.id)
    .maybeSingle()

  if (error) return jsonError('Could not verify driver profile.', 500)
  if (!data) return jsonError('Driver profile not found.', 404)

  return NextResponse.json({ ok: true, data })
}
