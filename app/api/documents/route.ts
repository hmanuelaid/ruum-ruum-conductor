import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError, requireAdmin, requireDriverOrAdmin } from '@/lib/api-auth'
import { parseDocumentPatch, readJsonObject } from '@/lib/api-validation'
import { normalizeDocumentStatus, normalizeDocumentUrl } from '@/lib/document-contract'
import { createSignedStorageUrl, DOCUMENTS_BUCKET } from '@/lib/private-storage'
import type { ApiAuthContext } from '@/lib/api-auth'

async function normalizeDocumentResponse(context: ApiAuthContext, row: Record<string, unknown>) {
  const legacyUrl = normalizeDocumentUrl(row)
  const storagePath = typeof row.storage_path === 'string' && row.storage_path.trim()
    ? row.storage_path.trim()
    : legacyUrl && !/^https?:\/\//i.test(legacyUrl)
      ? legacyUrl
      : ''
  const signedUrl = storagePath
    ? await createSignedStorageUrl(context.supabase, DOCUMENTS_BUCKET, storagePath)
    : null

  return {
    ...row,
    status: normalizeDocumentStatus(row.status),
    url: signedUrl ?? legacyUrl,
    storage_path: storagePath || row.storage_path,
  }
}

export async function GET() {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const forbidden = requireDriverOrAdmin(auth.context)
  if (forbidden) return forbidden

  let query = auth.context.supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (!auth.context.isAdmin) {
    query = query
      .eq('owner_type', 'driver')
      .eq('owner_id', auth.context.driverId)
  }

  const { data, error } = await query
  if (error) return jsonError('Could not load documents.', 500)

  const documents = await Promise.all(
    (data ?? []).map(row => normalizeDocumentResponse(auth.context, row))
  )

  return NextResponse.json({ ok: true, data: documents })
}

export async function PATCH(req: Request) {
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const forbidden = requireAdmin(auth.context)
  if (forbidden) return forbidden

  const body = await readJsonObject(req)
  if (!body.ok) return jsonError(body.error, 400)

  const parsed = parseDocumentPatch(body.value)
  if (!parsed.ok) return jsonError(parsed.error, 400)

  const update: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  }

  if (parsed.value.status !== undefined) update.status = parsed.value.status
  if (parsed.value.notes !== undefined) update.notes = parsed.value.notes

  const { data, error } = await auth.context.supabase
    .from('documents')
    .update(update)
    .eq('id', parsed.value.id)
    .select('*')
    .maybeSingle()

  if (error) return jsonError('Could not update document.', 500)
  if (!data) return jsonError('Document not found.', 404)

  return NextResponse.json({ ok: true, data: await normalizeDocumentResponse(auth.context, data) })
}
