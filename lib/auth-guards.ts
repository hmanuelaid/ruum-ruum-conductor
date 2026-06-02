import type { SupabaseClient, User } from '@supabase/supabase-js'

const ADMIN_ROLES = new Set(['admin', 'administrator', 'super_admin', 'superadmin', 'owner'])
const DRIVER_ROLES = new Set(['driver', 'conductor'])

type RoleRow = {
  type?: string | null
}

function normalizeRole(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null
}

function hasTrustedRole(user: User, roles: Set<string>) {
  const appMetadata = user.app_metadata ?? {}
  const role = normalizeRole(appMetadata.role ?? appMetadata.type)
  if (role && roles.has(role)) return true

  const roleList = Array.isArray(appMetadata.roles) ? appMetadata.roles : []
  return roleList.some(item => {
    const normalized = normalizeRole(item)
    return normalized ? roles.has(normalized) : false
  })
}

export function hasTrustedAdminRole(user: User) {
  return hasTrustedRole(user, ADMIN_ROLES)
}

export function hasTrustedDriverRole(user: User) {
  return hasTrustedRole(user, DRIVER_ROLES)
}

async function getAppUserTypeByField(
  supabase: SupabaseClient,
  field: 'id' | 'email',
  value: string
) {
  const { data, error } = await supabase
    .from('app_users')
    .select('type')
    .eq(field, value)
    .maybeSingle()

  if (error) return null
  return normalizeRole((data as RoleRow | null)?.type)
}

export async function hasAdminAccess(supabase: SupabaseClient, user: User) {
  if (hasTrustedAdminRole(user)) return true

  const typeById = await getAppUserTypeByField(supabase, 'id', user.id)
  if (typeById && ADMIN_ROLES.has(typeById)) return true

  if (!user.email) return false

  const typeByEmail = await getAppUserTypeByField(supabase, 'email', user.email)
  return Boolean(typeByEmail && ADMIN_ROLES.has(typeByEmail))
}

export async function hasDriverAccess(supabase: SupabaseClient, user: User) {
  if (hasTrustedDriverRole(user)) return true

  const { data, error } = await supabase
    .from('drivers')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  return !error && Boolean(data)
}
