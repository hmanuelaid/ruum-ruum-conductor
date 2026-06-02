import type { SupabaseClient } from '@supabase/supabase-js'

export const SIGNED_URL_EXPIRES_IN = 15 * 60
export const DOCUMENTS_BUCKET = 'documents'
export const TRIP_EVIDENCE_BUCKET = 'trip-evidence'

type FileValidationOptions = {
  acceptedTypes: string[]
  maxSizeBytes: number
  maxSizeMb: number
  label: string
}

export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function getFormFile(formData: FormData, key = 'file') {
  const value = formData.get(key)
  return value instanceof File ? value : null
}

export function validatePrivateUpload(file: File, options: FileValidationOptions): string | null {
  if (!options.acceptedTypes.includes(file.type)) {
    return `Tipo no permitido para ${options.label}.`
  }

  if (file.size > options.maxSizeBytes) {
    return `${options.label} supera ${options.maxSizeMb}MB.`
  }

  return null
}

export function safePathPart(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return cleaned || fallback
}

export function fileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (fromName) return fromName

  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'application/pdf') return 'pdf'

  return 'bin'
}

export async function createSignedStorageUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN)

  if (error) return null
  return data.signedUrl
}
