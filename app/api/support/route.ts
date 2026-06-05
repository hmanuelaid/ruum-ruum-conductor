import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError } from '@/lib/api-auth'
import { readJsonObject } from '@/lib/api-validation'

const SUPPORT_CATEGORIES = new Set([
  'viaje',
  'pago',
  'documentos',
  'app',
  'emergencia',
  'otro',
])

const SUPPORT_COLUMNS = [
  'id',
  'driver_id',
  'category',
  'priority',
  'subject',
  'message',
  'status',
  'created_at',
  'updated_at',
].join(',')

type SupportTicketInput = {
  category: string
  subject: string
  message: string
  priority: 'normal' | 'alta' | 'urgente'
}

function parseTicket(body: Record<string, unknown>): SupportTicketInput | string {
  const category = typeof body.category === 'string' ? body.category : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const priority = typeof body.priority === 'string' ? body.priority : 'normal'

  if (!SUPPORT_CATEGORIES.has(category)) return 'Invalid support category.'
  if (!subject || subject.length > 120) return 'Support subject is required and must be under 120 characters.'
  if (!message || message.length > 1200) return 'Support message is required and must be under 1200 characters.'
  if (!['normal', 'alta', 'urgente'].includes(priority)) return 'Invalid support priority.'

  return { category, subject, message, priority: priority as SupportTicketInput['priority'] }
}

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response
  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const { data, error } = await auth.context.supabase
    .from('support_tickets')
    .select(SUPPORT_COLUMNS)
    .eq('driver_id', auth.context.driverId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Could not load support tickets:', error)
    return jsonError('Could not load support tickets.', 500)
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response
  if (!auth.context.driverId) return jsonError('Driver profile required.', 403)

  const body = await readJsonObject(req)
  if (!body.ok) return jsonError(body.error, 400)

  const parsed = parseTicket(body.value)
  if (typeof parsed === 'string') return jsonError(parsed, 400)

  const { data, error } = await auth.context.supabase
    .from('support_tickets')
    .insert({
      driver_id: auth.context.driverId,
      category: parsed.category,
      priority: parsed.priority,
      subject: parsed.subject,
      message: parsed.message,
      status: 'abierto',
    })
    .select(SUPPORT_COLUMNS)
    .maybeSingle()

  if (error || !data) {
    console.error('Could not create support ticket:', error)
    return jsonError('Could not create support ticket.', 500)
  }

  return NextResponse.json({ ok: true, data })
}
