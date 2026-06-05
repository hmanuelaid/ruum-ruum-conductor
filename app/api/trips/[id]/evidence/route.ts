import { NextResponse } from 'next/server'
import { getApiAuthContext, jsonError, requireDriverOrAdmin } from '@/lib/api-auth'
import { EVIDENCE_ACCEPTED_TYPES, EVIDENCE_MAX_SIZE_BYTES, EVIDENCE_MAX_SIZE_MB } from '@/lib/storage'
import { isTripEvidenceType, TRIP_EVIDENCE_STATUS } from '@/lib/trip-flow'
import {
  createSignedStorageUrl,
  fileExtension,
  getFormFile,
  getFormString,
  safePathPart,
  TRIP_EVIDENCE_BUCKET,
  validatePrivateUpload,
} from '@/lib/private-storage'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getApiAuthContext()
  if (!auth.ok) return auth.response

  const forbidden = requireDriverOrAdmin(auth.context)
  if (forbidden) return forbidden

  const formData = await req.formData()
  const file = getFormFile(formData)
  const type = getFormString(formData, 'type')
  const notes = getFormString(formData, 'notes')

  if (!file) return jsonError('Evidence file is required.', 400)
  if (!isTripEvidenceType(type)) return jsonError('Invalid evidence type.', 400)

  const fileError = validatePrivateUpload(file, {
    acceptedTypes: EVIDENCE_ACCEPTED_TYPES,
    maxSizeBytes: EVIDENCE_MAX_SIZE_BYTES,
    maxSizeMb: EVIDENCE_MAX_SIZE_MB,
    label: 'evidencia',
  })
  if (fileError) return jsonError(fileError, 400)

  let tripQuery = auth.context.supabase
    .from('trips')
    .select('id, driver_id, status')
    .eq('id', id)

  if (!auth.context.isAdmin) {
    tripQuery = tripQuery.eq('driver_id', auth.context.driverId)
  }

  const { data: trip, error: tripError } = await tripQuery.maybeSingle()
  if (tripError) return jsonError('Could not verify trip ownership.', 500)
  if (!trip) return jsonError('Trip not found.', 404)
  if (!trip.driver_id) return jsonError('Trip has no assigned driver.', 400)

  if (trip.status !== TRIP_EVIDENCE_STATUS[type]) {
    return jsonError('Trip is not ready for this evidence type.', 409)
  }

  const safeTripId = safePathPart(id, 'trip')
  const safeType = safePathPart(type, 'evidence')
  const path = `${safeTripId}/${safeType}_${Date.now()}_${crypto.randomUUID()}.${fileExtension(file)}`

  const { error: uploadError } = await auth.context.supabase.storage
    .from(TRIP_EVIDENCE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadError) return jsonError('Could not upload evidence file.', 500)

  const signedUrl = await createSignedStorageUrl(auth.context.supabase, TRIP_EVIDENCE_BUCKET, path)

  const { data, error: insertError } = await auth.context.supabase
    .from('trip_evidence')
    .insert({
      trip_id: id,
      driver_id: trip.driver_id,
      type,
      photo_url: signedUrl ?? path,
      photo_storage_path: path,
      notes: notes || null,
    })
    .select('*')
    .maybeSingle()

  if (insertError || !data) {
    await auth.context.supabase.storage.from(TRIP_EVIDENCE_BUCKET).remove([path])
    return jsonError('Could not save evidence record.', 500)
  }

  return NextResponse.json({
    ok: true,
    data: {
      ...data,
      photo_url: signedUrl ?? '',
      photo_storage_path: path,
    },
  })
}
