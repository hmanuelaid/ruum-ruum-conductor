'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useAppStore } from '@/lib/store'
import { useDocuments } from '@/lib/useDocuments'
import { DocumentUploader } from '@/components/ui/DocumentUploader'

const DRIVER_DOCS = [
  { docType: 'ine', label: 'Identificación oficial (INE/Pasaporte)', required: true },
  { docType: 'licencia', label: 'Licencia de conducir vigente', required: true },
  { docType: 'comprobante', label: 'Comprobante de domicilio', required: true },
  { docType: 'antecedentes', label: 'No antecedentes penales (últimos 3 meses)', required: true },
  { docType: 'foto_perfil', label: 'Foto de perfil (fondo blanco)', required: true },
  { docType: 'curp', label: 'CURP', required: false },
  { docType: 'rfc', label: 'RFC con homoclave', required: false },
]

const SECTIONS = [
  {
    title: '📋 Documentos personales',
    docs: ['ine', 'licencia', 'comprobante', 'antecedentes', 'foto_perfil'],
  },
  {
    title: '📄 Documentos fiscales (opcionales)',
    docs: ['curp', 'rfc'],
  },
]

type DriverProfile = {
  id: string
  name: string
  phone?: string | null
  email: string
  onboarding_status?: string | null
}

type DriverProfileResponse =
  | { ok: true; data: DriverProfile }
  | { ok: false; error?: string }

export default function DocumentosPage() {
  const router = useRouter()
  const { driver, setDriver } = useAuthStore()
  const { showToast } = useAppStore()

  const [profileLoading, setProfileLoading] = useState(!driver)
  const [profileError, setProfileError] = useState('')
  const [saving, setSaving] = useState(false)

  const ownerId = driver?.id ?? null
  const ownerName = driver?.name ?? 'Conductor'

  const { docs, loading, updateDoc } = useDocuments(ownerId, DRIVER_DOCS)

  useEffect(() => {
    if (driver) {
      setProfileLoading(false)
      return
    }

    async function loadDriverProfile() {
      setProfileLoading(true)
      setProfileError('')

      try {
        const response = await fetch('/api/drivers/profile', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        })

        const payload = (await response.json().catch(() => null)) as DriverProfileResponse | null

        if (response.status === 401) {
          router.replace('/login?next=/onboarding/documentos')
          return
        }

        if (!response.ok || !payload?.ok) {
          const message =
            payload && !payload.ok
              ? payload.error
              : 'No pudimos cargar tu perfil de conductor.'

          setProfileError(message ?? 'No pudimos cargar tu perfil de conductor.')
          return
        }

        setDriver({
          id: payload.data.id,
          name: payload.data.name,
          phone: payload.data.phone ?? '',
          email: payload.data.email,
        })
      } catch {
        setProfileError('No pudimos cargar tu perfil. Revisa tu conexión e intenta de nuevo.')
      } finally {
        setProfileLoading(false)
      }
    }

    void loadDriverProfile()
  }, [driver, router, setDriver])

  const requiredDocs = docs.filter((doc) => doc.required)
  const uploadedRequired = requiredDocs.filter(
    (doc) => doc.status === 'en_revision' || doc.status === 'aprobado',
  )

  const requiredDone = uploadedRequired.length === requiredDocs.length

  const progress =
    requiredDocs.length > 0
      ? Math.round((uploadedRequired.length / requiredDocs.length) * 100)
      : 0

  async function updateOnboardingStatus(status: 'documents_pending' | 'submitted') {
    const response = await fetch('/api/drivers/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding_status: status }),
    })

    const payload = (await response.json().catch(() => null)) as
      | { ok: true }
      | { ok: false; error?: string }
      | null

    if (!response.ok || !payload?.ok) {
      const message =
        payload && !payload.ok
          ? payload.error
          : 'No pudimos actualizar tu onboarding.'

      throw new Error(message ?? 'No pudimos actualizar tu onboarding.')
    }
  }

  async function handleSubmitDocuments() {
    if (!requiredDone || saving) return

    setSaving(true)
    setProfileError('')

    try {
      await updateOnboardingStatus('submitted')
      showToast('¡Documentos enviados! Revisamos tu perfil en menos de 24 h.')
      router.replace('/onboarding/en-revision')
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'No pudimos enviar tus documentos.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDraft() {
    if (saving) return

    setSaving(true)
    setProfileError('')

    try {
      await updateOnboardingStatus('documents_pending')
      showToast('Borrador guardado. Puedes continuar después.')
      router.replace('/login')
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'No pudimos guardar el borrador.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding-shell" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <button className="btn-back" onClick={() => router.back()}>
        ← Atrás
      </button>

      <div className="onboarding-card" style={{ gap: '1.25rem', maxWidth: 440 }}>
        <div className="step-badge">Paso 3 de 3</div>

        <div>
          <h1 className="onboarding-title">Documentación requerida</h1>
          <p className="onboarding-sub">
            Necesitamos validar tu identidad y habilitaciones para operar como conductor certificado
            Ruum Ruum.
          </p>
        </div>

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span className="muted">Progreso de documentación</span>
              <strong style={{ color: requiredDone ? 'var(--success)' : 'var(--primary)' }}>
                {uploadedRequired.length}/{requiredDocs.length}
              </strong>
            </div>

            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: 'var(--border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: requiredDone ? 'var(--success)' : 'var(--primary)',
                  borderRadius: 3,
                  transition: 'width .3s ease',
                }}
              />
            </div>
          </div>
        )}

        {profileError && (
          <div
            style={{
              background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              fontSize: 13,
              color: 'var(--danger)',
            }}
          >
            {profileError}
          </div>
        )}

        {profileLoading || loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <p className="muted">
              {profileLoading ? 'Cargando tu perfil…' : 'Cargando documentos…'}
            </p>
          </div>
        ) : !ownerId ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <p className="muted">Completa tu registro para subir documentos.</p>
          </div>
        ) : (
          SECTIONS.map((section) => {
            const sectionDocs = docs.filter((doc) => section.docs.includes(doc.docType))

            return (
              <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    paddingBottom: 4,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {section.title}
                </p>

                {sectionDocs.map((doc) => (
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
            )
          })
        )}

        <div
          style={{
            background: 'var(--primary-dim)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: 13,
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: 4 }}>🔍 ¿Qué pasa después?</p>
          <p className="muted">
            Nuestro equipo revisa tus documentos en menos de 24 horas. Te notificamos cuando tu
            cuenta esté activa o si necesitamos algo más.
          </p>
        </div>

        <button
          className="btn-primary"
          disabled={!requiredDone || saving || profileLoading || loading || !ownerId}
          onClick={handleSubmitDocuments}
        >
          {saving
            ? 'Guardando…'
            : requiredDone
              ? 'Enviar documentos →'
              : `Faltan ${requiredDocs.length - uploadedRequired.length} documentos`}
        </button>

        <button
          className="btn-ghost"
          onClick={handleSaveDraft}
          disabled={saving || profileLoading || loading || !ownerId}
        >
          Guardar y completar más tarde
        </button>
      </div>
    </div>
  )
}