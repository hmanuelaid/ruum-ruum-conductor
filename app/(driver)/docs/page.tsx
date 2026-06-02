'use client'
import { DocumentUploader } from '@/components/ui/DocumentUploader'
import { Chip } from '@/components/ui/Chip'
import { useDocuments } from '@/lib/useDocuments'
import { useDriverProfile } from '@/lib/useDriverProfile'

const DRIVER_DOCS = [
  { docType: 'ine',          label: 'Identificacion oficial (INE/Pasaporte)',    required: true  },
  { docType: 'licencia',     label: 'Licencia de conducir vigente',              required: true  },
  { docType: 'comprobante',  label: 'Comprobante de domicilio',                  required: true  },
  { docType: 'antecedentes', label: 'No antecedentes penales (ultimos 3 meses)', required: true  },
  { docType: 'foto_perfil',  label: 'Foto de perfil (fondo blanco)',             required: true  },
  { docType: 'curp',         label: 'CURP',                                      required: false },
  { docType: 'rfc',          label: 'RFC con homoclave',                         required: false },
]

export default function DocsPage() {
  const { driver, loading: driverLoading } = useDriverProfile()
  const ownerId = driver?.id ?? null
  const ownerName = driver?.name ?? 'Conductor'
  const { docs, loading, updateDoc } = useDocuments(ownerId, DRIVER_DOCS)

  const requiredDocs = docs.filter(doc => doc.required)
  const completedRequired = requiredDocs.filter(doc =>
    doc.status === 'en_revision' || doc.status === 'aprobado'
  )
  const pendingCount = requiredDocs.length - completedRequired.length

  if (driverLoading) {
    return <p className="muted">Cargando documentos...</p>
  }

  if (!ownerId) {
    return (
      null
    )
  }

  return (
    <>
      <div className="section-head">
        <h2>Documentos</h2>
        {pendingCount > 0 ? (
          <Chip variant="warning">{pendingCount} pendientes</Chip>
        ) : (
          <Chip variant="success">Completos</Chip>
        )}
      </div>

      {loading ? (
        <p className="muted">Cargando documentos...</p>
      ) : (
        <div className="stack">
          {docs.map(doc => (
            <DocumentUploader
              key={doc.docType}
              doc={doc}
              ownerId={ownerId}
              ownerType="driver"
              ownerName={ownerName}
              onUploaded={updateDoc}
            />
          ))}
        </div>
      )}
    </>
  )
}
