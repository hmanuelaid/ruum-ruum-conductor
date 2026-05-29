
// ════════════════════════════════════════════════════════════════════
// app/(driver)/docs/page.tsx
// ════════════════════════════════════════════════════════════════════
import { Chip } from '@/components/ui/Chip'
import { mockDocuments } from '@/lib/mock-data'

const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprobada', review: 'En revisión', pending: 'Pendiente de validación',
}

const pendingCount = (docs: typeof mockDocuments) => docs.filter(d => d.status === 'pending').length

export default function DocsPage() {
  const pending = pendingCount(mockDocuments)

  return (
    <>
      <div className="section-head">
        <h2>Documentos</h2>
        {pending > 0 && <Chip variant="warning">Pendientes</Chip>}
      </div>

      <div className="stack">
        {mockDocuments.map(doc => (
          <article key={doc.id} className={`document-row ${doc.status}`}>
            <div>
              <strong>{doc.name}</strong>
              <span>{STATUS_LABELS[doc.status]}</span>
            </div>
            {doc.status === 'pending' ? (
              <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>Subir</button>
            ) : (
              <button className="btn-mini" aria-label={`Ver ${doc.name}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6"/></svg>
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  )
}