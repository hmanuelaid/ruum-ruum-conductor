export const DOCUMENT_STATUSES = [
  'pendiente_carga',
  'en_revision',
  'aprobado',
  'rechazado',
  'vencido',
] as const

export type DocumentStatus = typeof DOCUMENT_STATUSES[number]

export interface DocumentItem {
  id?: string
  docType: string
  label: string
  required: boolean
  status: DocumentStatus
  url?: string
  notes?: string
}

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; emoji: string }> = {
  pendiente_carga: { label: 'Pendiente', color: 'var(--text-muted)', emoji: '📎' },
  en_revision: { label: 'En revision', color: 'var(--warning)', emoji: '🔍' },
  aprobado: { label: 'Aprobado', color: 'var(--success)', emoji: '✅' },
  rechazado: { label: 'Rechazado', color: 'var(--danger)', emoji: '❌' },
  vencido: { label: 'Vencido', color: 'var(--danger)', emoji: '⚠️' },
}

export const DOCUMENT_STATUS_OPTIONS = DOCUMENT_STATUSES.map(value => ({
  value,
  ...DOCUMENT_STATUS_CONFIG[value],
}))

const LEGACY_DOCUMENT_STATUSES: Record<string, DocumentStatus> = {
  pendiente: 'pendiente_carga',
  pending: 'pendiente_carga',
  uploaded: 'en_revision',
  review: 'en_revision',
  pendiente_revision: 'en_revision',
  pendiente_validacion: 'en_revision',
  approved: 'aprobado',
  rejected: 'rechazado',
  expired: 'vencido',
}

export function isDocumentStatus(value: unknown): value is DocumentStatus {
  return typeof value === 'string' && DOCUMENT_STATUSES.includes(value as DocumentStatus)
}

export function normalizeDocumentStatus(value: unknown): DocumentStatus {
  if (isDocumentStatus(value)) return value
  if (typeof value === 'string') return LEGACY_DOCUMENT_STATUSES[value] ?? 'pendiente_carga'
  return 'pendiente_carga'
}

export function normalizeDocumentUrl(row: { url?: unknown; file_url?: unknown } | null | undefined): string | undefined {
  const canonicalUrl = typeof row?.url === 'string' ? row.url.trim() : ''
  if (canonicalUrl) return canonicalUrl

  const legacyUrl = typeof row?.file_url === 'string' ? row.file_url.trim() : ''
  return legacyUrl || undefined
}
