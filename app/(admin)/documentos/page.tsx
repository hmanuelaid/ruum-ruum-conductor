'use client'
import { useEffect, useState } from 'react'
import {
  DOCUMENT_STATUS_OPTIONS,
  normalizeDocumentStatus,
  normalizeDocumentUrl,
  type DocumentStatus,
} from '@/lib/document-contract'

interface AdminDocument {
  id: string
  driver_id?: string | null
  owner_id?: string | null
  owner_name?: string | null
  type: string
  status: DocumentStatus
  url?: string | null
  file_url?: string | null
  storage_path?: string | null
  created_at: string
  drivers?: { name: string } | null
}

type DocumentsApiResponse =
  | { ok: true; data: AdminDocument[] }
  | { ok: false; error?: string }

export default function DocumentosPage() {
  const [docs, setDocs] = useState<AdminDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    const response = await fetch('/api/documents', { cache: 'no-store' })
    const payload = await response.json().catch(() => null) as DocumentsApiResponse | null
    const data = response.ok && payload?.ok ? payload.data : []

    const normalizedDocs = data.map(row => ({
      ...row,
      status: normalizeDocumentStatus(row.status),
    }))

    setDocs(normalizedDocs)
    setLoading(false)
  }

  async function updateDocumentStatus(docId: string, newStatus: DocumentStatus) {
    await fetch('/api/documents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: docId,
        status: newStatus,
      }),
    })
    loadDocuments()
  }

  return (
    <div style={{ padding: 20 }}>
      <div className="page-header">
        <h1 className="page-title">Documentos</h1>
        <p className="page-sub">{docs.length} documentos</p>
      </div>

      {loading ? (
        <div className="card">Cargando...</div>
      ) : docs.length === 0 ? (
        <div className="card">Sin documentos subidos</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Conductor</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => {
                const documentUrl = normalizeDocumentUrl(doc)

                return (
                  <tr key={doc.id}>
                    <td className="td-bold">{doc.drivers?.name || doc.owner_name || '—'}</td>
                    <td>{doc.type}</td>
                    <td>
                      <select
                        value={doc.status}
                        onChange={(e) => updateDocumentStatus(doc.id, e.target.value as DocumentStatus)}
                        style={{ padding: '4px 8px', borderRadius: 6 }}
                      >
                        {DOCUMENT_STATUS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.emoji} {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="td-muted">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td>
                      {documentUrl ? (
                        <a href={documentUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12 }}>
                          Ver documento
                        </a>
                      ) : (
                        <span className="td-muted" style={{ fontSize: 12 }}>
                          Sin archivo
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
