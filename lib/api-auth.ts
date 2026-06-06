import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { hasAdminAccess } from './auth-guards'
import { checkRateLimit } from './rateLimit'
import { createServerSupabaseClient } from './supabase-server'

export type ApiAuthContext = {
  supabase: SupabaseClient
  user: User
  isAdmin: boolean
  driverId: string | null
}

type ApiAuthResult =
  | { ok: true; context: ApiAuthContext }
  | { ok: false; response: NextResponse }

type RateLimitPreset = 'upload' | 'trips'

const RATE_LIMIT_PRESETS: Record<RateLimitPreset, {
  prefix: string
  limit: number
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
}> = {
  upload: {
    prefix: 'driver-document-upload',
    limit: 6,
    window: '10 m',
  },
  trips: {
    prefix: 'driver-trip-action',
    limit: 20,
    window: '10 m',
  },
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function getApiAuthContext(
  request?: Request,
  rlPreset?: RateLimitPreset
): Promise<ApiAuthResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false, response: jsonError('Authentication required.', 401) }
  }

  const isAdmin = await hasAdminAccess(supabase, user)
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  const driverId = driver?.id ?? null

  if (request && rlPreset) {
    const rateLimitResponse = await checkRateLimit(
      request,
      driverId ?? user.id,
      RATE_LIMIT_PRESETS[rlPreset]
    )
    if (rateLimitResponse) return { ok: false, response: rateLimitResponse }
  }

  return {
    ok: true,
    context: {
      supabase,
      user,
      isAdmin,
      driverId,
    },
  }
}

export function requireAdmin(context: ApiAuthContext) {
  return context.isAdmin ? null : jsonError('Admin access required.', 403)
}

export function requireDriverOrAdmin(context: ApiAuthContext) {
  return context.isAdmin || context.driverId
    ? null
    : jsonError('Driver profile required.', 403)
}
