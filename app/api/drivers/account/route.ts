import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import { readJsonObject } from '@/lib/api-validation'
import type { DriverAccountSettings } from '@/lib/types'

const ACCOUNT_COLUMNS = [
  'name',
  'phone',
  'email',
  'bank_name',
  'bank_account_holder',
  'bank_clabe',
].join(',')

function normalizeAccount(row: Partial<DriverAccountSettings> | null): DriverAccountSettings {
  return {
    name: typeof row?.name === 'string' ? row.name : '',
    phone: typeof row?.phone === 'string' ? row.phone : '',
    email: typeof row?.email === 'string' ? row.email : '',
    bank_name: typeof row?.bank_name === 'string' ? row.bank_name : '',
    bank_account_holder: typeof row?.bank_account_holder === 'string' ? row.bank_account_holder : '',
    bank_clabe: typeof row?.bank_clabe === 'string' ? row.bank_clabe : '',
  }
}

function parseAccount(body: Record<string, unknown>): DriverAccountSettings | string {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const bankName = typeof body.bank_name === 'string' ? body.bank_name.trim() : ''
  const bankAccountHolder = typeof body.bank_account_holder === 'string' ? body.bank_account_holder.trim() : ''
  const bankClabe = typeof body.bank_clabe === 'string' ? body.bank_clabe.replace(/\s+/g, '') : ''

  if (!name) return 'Driver name is required.'
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Driver email is invalid.'
  if (bankClabe && !/^\d{18}$/.test(bankClabe)) return 'CLABE must have 18 digits.'

  return {
    name,
    phone,
    email,
    bank_name: bankName,
    bank_account_holder: bankAccountHolder,
    bank_clabe: bankClabe,
  }
}

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response
  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .select(ACCOUNT_COLUMNS)
    .eq('id', auth.context.driverId)
    .maybeSingle()

  if (error) {
    console.error('Could not load account settings:', error)
    return jsonError('Could not load account settings.', 500)
  }
  if (!data) return jsonError('Driver not found.', 404)

  return NextResponse.json({
    ok: true,
    data: normalizeAccount(data as unknown as Partial<DriverAccountSettings>),
  })
}

export async function PATCH(req: Request) {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response
  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const body = await readJsonObject(req)
  if (!body.ok) return jsonError(body.error, 400)

  const parsed = parseAccount(body.value)
  if (typeof parsed === 'string') return jsonError(parsed, 400)

  const { data, error } = await auth.context.supabase
    .from('drivers')
    .update(parsed)
    .eq('id', auth.context.driverId)
    .select(ACCOUNT_COLUMNS)
    .maybeSingle()

  if (error) {
    console.error('Could not update account settings:', error)
    return jsonError('Could not update account settings.', 500)
  }
  if (!data) return jsonError('Driver not found.', 404)

  return NextResponse.json({
    ok: true,
    data: normalizeAccount(data as unknown as Partial<DriverAccountSettings>),
  })
}
