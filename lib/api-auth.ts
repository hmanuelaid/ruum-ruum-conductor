import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { hasAdminAccess } from './auth-guards'
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

export function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function getApiAuthContext(): Promise<ApiAuthResult> {
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

  return {
    ok: true,
    context: {
      supabase,
      user,
      isAdmin,
      driverId: driver?.id ?? null,
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
