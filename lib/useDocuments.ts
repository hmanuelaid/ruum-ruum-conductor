// lib/useDocuments.ts
'use client'
import { useState, useEffect } from 'react'
import { createClient } from './supabase'
import {
  normalizeDocumentStatus,
  normalizeDocumentUrl,
  type DocumentItem,
} from '@/lib/document-contract'

type DocumentRow = {
  id?: string
  type?: string
  owner_id?: string
  status?: unknown
  url?: unknown
  file_url?: unknown
  storage_path?: unknown
  notes?: unknown
}

type DocumentsApiResponse =
  | { ok: true; data: DocumentRow[] }
  | { ok: false; error?: string }

export function useDocuments(ownerId: string | null, docTypes: { docType: string; label: string; required: boolean }[]) {
  const [docs, setDocs]       = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(Boolean(ownerId))

  useEffect(() => {
    if (!ownerId) {
      queueMicrotask(() => {
        setDocs([])
        setLoading(false)
      })
      return
    }

    const supabase = createClient()
    async function loadDocuments() {
      let data: DocumentRow[] = []

      try {
        const response = await fetch('/api/documents', { cache: 'no-store' })
        const payload = await response.json().catch(() => null) as DocumentsApiResponse | null
        data = response.ok && payload?.ok ? payload.data : []
      } catch {
        data = []
      }

      const merged = docTypes.map(dt => {
        const found = data.find(d => d.type === dt.docType && String(d.owner_id ?? '') === ownerId)
        return {
          id:       found?.id,
          docType:  dt.docType,
          label:    dt.label,
          required: dt.required,
          status:   normalizeDocumentStatus(found?.status),
          url:      normalizeDocumentUrl(found),
          notes:    typeof found?.notes === 'string' ? found.notes : undefined,
        }
      })
      setDocs(merged)
      setLoading(false)
    }

    void loadDocuments()

    // Realtime
    const channel = supabase
      .channel(`documents:${ownerId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'documents',
        filter: `owner_id=eq.${ownerId}`,
      }, () => void loadDocuments())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [docTypes, ownerId])

  function updateDoc(updated: DocumentItem) {
    setDocs(prev => prev.map(d => d.docType === updated.docType ? updated : d))
  }

  return { docs, loading, updateDoc }
}
