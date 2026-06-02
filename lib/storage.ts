export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const MAX_SIZE_MB = 10
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
export const EVIDENCE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const EVIDENCE_MAX_SIZE_MB = 5
export const EVIDENCE_MAX_SIZE_BYTES = EVIDENCE_MAX_SIZE_MB * 1024 * 1024

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Tipo no permitido. Usa JPG, PNG, WEBP o PDF.`
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `El archivo supera ${MAX_SIZE_MB}MB.`
  }
  return null
}

export function getPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

export async function uploadDocument(params: {
  file: File
  ownerId: string
  ownerType: 'user' | 'driver'
  ownerName: string
  docType: string
}): Promise<{ url: string; path: string } | { error: string }> {
  const formData = new FormData()
  formData.set('file', params.file)
  formData.set('ownerId', params.ownerId)
  formData.set('ownerType', params.ownerType)
  formData.set('ownerName', params.ownerName)
  formData.set('docType', params.docType)

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json().catch(() => null) as {
    ok?: boolean
    error?: string
    data?: { url?: string; storage_path?: string }
  } | null

  if (!response.ok || !payload?.ok || !payload.data?.storage_path) {
    return { error: payload?.error ?? 'No se pudo subir el documento.' }
  }

  return { url: payload.data.url ?? '', path: payload.data.storage_path }
}

export async function uploadTripEvidence(params: {
  file: File
  tripId: string
  type: 'pickup' | 'delivery'
  notes?: string
}): Promise<{ url: string; path: string } | { error: string }> {
  const formData = new FormData()
  formData.set('file', params.file)
  formData.set('type', params.type)
  if (params.notes) formData.set('notes', params.notes)

  const response = await fetch(`/api/trips/${encodeURIComponent(params.tripId)}/evidence`, {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json().catch(() => null) as {
    ok?: boolean
    error?: string
    data?: { photo_url?: string; photo_storage_path?: string }
  } | null

  if (!response.ok || !payload?.ok || !payload.data?.photo_storage_path) {
    return { error: payload?.error ?? 'No se pudo subir la evidencia.' }
  }

  return {
    url: payload.data.photo_url ?? '',
    path: payload.data.photo_storage_path,
  }
}
