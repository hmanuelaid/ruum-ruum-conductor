import { isDocumentStatus, type DocumentStatus } from '@/lib/document-contract'
import { isTripPatchStatus } from '@/lib/trip-flow'

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

export type TripPatchInput = {
  status: string
}

export type DocumentPatchInput = {
  id: string
  status?: DocumentStatus
  notes?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  const allowed = new Set(keys)
  return Object.keys(value).every(key => allowed.has(key))
}

export async function readJsonObject(req: Request): Promise<ValidationResult<Record<string, unknown>>> {
  try {
    const value = await req.json()
    if (!isRecord(value)) {
      return { ok: false, error: 'Request body must be a JSON object.' }
    }

    return { ok: true, value }
  } catch {
    return { ok: false, error: 'Invalid JSON body.' }
  }
}

export function parseTripPatch(body: Record<string, unknown>): ValidationResult<TripPatchInput> {
  if (!hasOnlyKeys(body, ['status'])) {
    return { ok: false, error: 'Unexpected fields in trip update.' }
  }

  if (!isTripPatchStatus(body.status)) {
    return { ok: false, error: 'Invalid trip status.' }
  }

  return { ok: true, value: { status: body.status } }
}

export function parseDocumentPatch(body: Record<string, unknown>): ValidationResult<DocumentPatchInput> {
  if (!hasOnlyKeys(body, ['id', 'status', 'notes'])) {
    return { ok: false, error: 'Unexpected fields in document update.' }
  }

  if (typeof body.id !== 'string' || body.id.trim() === '') {
    return { ok: false, error: 'Document id is required.' }
  }

  const status = body.status

  if (status !== undefined && !isDocumentStatus(status)) {
    return { ok: false, error: 'Invalid document status.' }
  }

  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
    return { ok: false, error: 'Document notes must be a string or null.' }
  }

  if (body.status === undefined && body.notes === undefined) {
    return { ok: false, error: 'At least one document field must be provided.' }
  }

  return {
    ok: true,
    value: {
      id: body.id,
      status,
      notes: body.notes ?? null,
    },
  }
}
