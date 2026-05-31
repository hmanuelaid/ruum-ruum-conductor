'use client'
import { useEffect, useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { createClient } from '@/lib/supabase'

interface Document {
  id: string
  driver_id: string
  type: string
  status: string
  file_url: string
  created_at: string
  drivers?: { name: string }
}

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    const supabase = createClient()
    const { data } = await supabase
      .from('documents')
      .select('*, drivers(name)')
      .order('created_at', { ascending: false })
    
    setDocs(data ?? [])
    setLoading(false)
  }

  async function updateDocumentStatus(docId: string, newStatus: string) {
    const supabase = createClient()
    await supabase
      .from('documents')
      .update({ status: newStatus })
      .eq('id', docId)
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
              {docs.map(doc => (
                <tr key={doc.id}>
                  <td className="td-bold">{doc.drivers?.name || '—'}</td>
                  <td>{doc.type}</td>
                  <td>
                    <select 
                      value={doc.status}
                      onChange={(e) => updateDocumentStatus(doc.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 6 }}
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="aprobado">✅ Aprobado</option>
                      <option value="rechazado">❌ Rechazado</option>
                    </select>
                  </td>
                  <td className="td-muted">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td>
                    <a href={doc.file_url} target="_blank" className="btn-ghost" style={{ fontSize: 12 }}>
                      Ver documento
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}