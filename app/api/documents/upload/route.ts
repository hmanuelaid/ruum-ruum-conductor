import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError, requireDriverOrAdmin } from '@/lib/api-auth'
import { ACCEPTED_TYPES, MAX_SIZE_BYTES, MAX_SIZE_MB } from '@/lib/storage'
import {
  createSignedStorageUrl,
  DOCUMENTS_BUCKET,
  fileExtension,
  getFormFile,
  getFormString,
  safePathPart,
  validatePrivateUpload,
} from '@/lib/private-storage'

export async function POST(req: Request) {
  const auth = await getApiAuthContext(req, 'upload')
  if (!auth.ok) return auth.response

  const forbidden = requireDriverOrAdmin(auth.context)
  if (forbidden) return forbidden

  const formData = await req.formData()
  const file = getFormFile(formData)
  const ownerId = getFormString(formData, 'ownerId')
  const ownerType = getFormString(formData, 'ownerType')
  const ownerName = getFormString(formData, 'ownerName')
  const docType = getFormString(formData, 'docType')

  if (!file) return jsonError('Document file is required.', 400)
  if (!ownerId || !docType) return jsonError('Document owner and type are required.', 400)
  if (ownerType !== 'driver' && ownerType !== 'user') return jsonError('Invalid document owner type.', 400)

  if (!auth.context.isAdmin && (ownerType !== 'driver' || ownerId !== auth.context.driverId)) {
    return jsonError('Cannot upload documents for another owner.', 403)
  }

  const fileError = validatePrivateUpload(file, {
    acceptedTypes: ACCEPTED_TYPES,
    maxSizeBytes: MAX_SIZE_BYTES,
    maxSizeMb: MAX_SIZE_MB,
    label: 'documento',
  })
  if (fileError) return jsonError(fileError, 400)

  const bytes = Buffer.from(await file.arrayBuffer())
  const safeOwnerType = ownerType === 'driver' ? 'driver' : 'user'
  const safeOwnerId = safePathPart(ownerId, 'owner')
  const safeDocType = safePathPart(docType, 'documento')
  const path = `${safeOwnerType}/${safeOwnerId}/${safeDocType}_${Date.now()}_${crypto.randomUUID()}.${fileExtension(file)}`

  const { error: uploadError } = await auth.context.supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, bytes, { upsert: false, contentType: file.type })

  if (uploadError) {
    return jsonError(`Could not upload document file: ${uploadError.message}`, 500)
  }

  const now = new Date().toISOString()
  const documentPayload = {
    owner_id: ownerId,
    owner_type: ownerType,
    owner_name: ownerName || auth.context.user.email || 'Usuario',
    type: docType,
    status: 'en_revision',
    url: path,
    storage_path: path,
    uploaded_at: now,
    updated_at: now,
  }

  const { data: existing, error: lookupError } = await auth.context.supabase
    .from('documents')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('owner_type', ownerType)
    .eq('type', docType)
    .maybeSingle()

  if (lookupError) {
    await auth.context.supabase.storage.from(DOCUMENTS_BUCKET).remove([path])
    return jsonError('Could not verify document record.', 500)
  }

  const saveQuery = existing
    ? auth.context.supabase
      .from('documents')
      .update(documentPayload)
      .eq('id', existing.id)
      .select('*')
      .maybeSingle()
    : auth.context.supabase
      .from('documents')
      .insert(documentPayload)
      .select('*')
      .maybeSingle()

  const { data, error: saveError } = await saveQuery

  if (saveError || !data) {
    await auth.context.supabase.storage.from(DOCUMENTS_BUCKET).remove([path])
    return jsonError('Could not save document record.', 500)
  }

  const signedUrl = await createSignedStorageUrl(auth.context.supabase, DOCUMENTS_BUCKET, path)

  return NextResponse.json({
    ok: true,
    data: {
      ...data,
      url: signedUrl ?? '',
      storage_path: path,
    },
  })
}
