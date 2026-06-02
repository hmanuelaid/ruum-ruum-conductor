'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useAppStore } from '@/lib/store'
import { useDocuments } from '@/lib/useDocuments'
import { DocumentUploader } from '@/components/ui/DocumentUploader'
import { createClient } from '@/lib/supabase'

const DRIVER_DOCS = [
  { docType: 'ine',          label: 'Identificación oficial (INE/Pasaporte)',    required: true  },
  { docType: 'licencia',     label: 'Licencia de conducir vigente',              required: true  },
  { docType: 'comprobante',  label: 'Comprobante de domicilio',                  required: true  },
  { docType: 'antecedentes', label: 'No antecedentes penales (últimos 3 meses)', required: true  },
  { docType: 'foto_perfil',  label: 'Foto de perfil (fondo blanco)',             required: true  },
  { docType: 'curp',         label: 'CURP',                                      required: false },
  { docType: 'rfc',          label: 'RFC con homoclave',                         required: false },
]

const SECTIONS = [
  { title: '📋 Documentos personales',          docs: ['ine','licencia','comprobante','antecedentes','foto_perfil'] },
  { title: '📄 Documentos fiscales (opcionales)', docs: ['curp','rfc'] },
]

type DriverProfileResponse =
  | { ok: true; data: { id: string; name: string; phone?: string | null; email: string } }
  | { ok: false; error?: string }

export default function DocumentosPage() {
  const router = useRouter()
  const { driver, setDriver, completeOnboarding } = useAuthStore()
  const { showToast } = useAppStore()
  const [profileLoading, setProfileLoading] = useState(!driver)
  const [profileError, setProfileError] = useState('')

  const ownerId   = driver?.id   ?? null
  const ownerName = driver?.name ?? 'Conductor'

  const { docs, loading, updateDoc } = useDocuments(ownerId, DRIVER_DOCS)

  useEffect(() => {
    if (driver) return

    async function createDriverProfile() {
      setProfileLoading(true)
      setProfileError('')

      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('reg_data') : null
      const reg = raw ? JSON.parse(raw) as {
        name?: string
        phone?: string
        email?: string
        password?: string
      } : null

      if (!reg?.email || !reg.password || !reg.name) {
        setProfileError('No encontramos los datos de registro. Vuelve a iniciar el registro.')
        setProfileLoading(false)
        return
      }

      const supabase = createClient()

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: reg.email,
        password: reg.password,
      })

      if (signUpError) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: reg.email,
          password: reg.password,
        })

        if (signInError) {
          setProfileError(signUpError.message)
          setProfileLoading(false)
          return
        }
      }

      if (!signUpError && !signUpData.user) {
        setProfileError('No se pudo crear la sesion del conductor.')
        setProfileLoading(false)
        return
      }

      const profileResponse = await fetch('/api/drivers/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reg.name,
          phone: reg.phone ?? '',
          email: reg.email,
        }),
      })
      const profilePayload = await profileResponse.json().catch(() => null) as DriverProfileResponse | null

      if (!profileResponse.ok || !profilePayload?.ok) {
        const errorMessage = profilePayload && !profilePayload.ok ? profilePayload.error : null
        setProfileError(errorMessage ?? 'No se pudo crear el perfil de conductor.')
        setProfileLoading(false)
        return
      }

      setDriver({
        id: profilePayload.data.id,
        name: profilePayload.data.name,
        phone: profilePayload.data.phone ?? '',
        email: profilePayload.data.email,
      })
      setProfileLoading(false)
    }

    void createDriverProfile()
  }, [driver, setDriver])

  const requiredDocs      = docs.filter(d => d.required)
  const uploadedRequired  = requiredDocs.filter(
    d => d.status === 'en_revision' || d.status === 'aprobado'
  )
  const requiredDone = uploadedRequired.length === requiredDocs.length
  const progress     = requiredDocs.length > 0
    ? Math.round((uploadedRequired.length / requiredDocs.length) * 100)
    : 0

  function handleFinish() {
    completeOnboarding()
    showToast('¡Documentos enviados! Revisamos tu perfil en menos de 24 h.')
    router.replace('/panel')
  }

  return (
    <div className="onboarding-shell" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>

      <div className="onboarding-card" style={{ gap: '1.25rem', maxWidth: 440 }}>
        <div className="step-badge">Paso 3 de 3</div>

        <div>
          <h1 className="onboarding-title">Documentación requerida</h1>
          <p className="onboarding-sub">
            Necesitamos validar tu identidad y habilitaciones para operar como conductor certificado Ruum Ruum.
          </p>
        </div>

        {/* Barra de progreso */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span className="muted">Progreso de documentación</span>
              <strong style={{ color: requiredDone ? 'var(--success)' : 'var(--primary)' }}>
                {uploadedRequired.length}/{requiredDocs.length}
              </strong>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: requiredDone ? 'var(--success)' : 'var(--primary)',
                borderRadius: 3,
                transition: 'width .3s ease',
              }} />
            </div>
          </div>
        )}

        {profileError && (
          <div style={{
            background: 'rgba(239,68,68,.08)',
            border: '1px solid rgba(239,68,68,.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--danger)',
          }}>
            {profileError}
          </div>
        )}

        {profileLoading || loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <p className="muted">
              {profileLoading ? 'Preparando tu perfil…' : 'Cargando documentos…'}
            </p>
          </div>
        ) : !ownerId ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <p className="muted">Completa tu registro para subir documentos.</p>
          </div>
        ) : (
          SECTIONS.map(section => {
            const sectionDocs = docs.filter(d => section.docs.includes(d.docType))
            return (
              <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--text-muted)',
                  paddingBottom: 4, borderBottom: '1px solid var(--border)',
                }}>
                  {section.title}
                </p>
                {sectionDocs.map(doc => (
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

        {/* Info */}
        <div style={{
          background: 'var(--primary-dim)', border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 13,
        }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>🔍 ¿Qué pasa después?</p>
          <p className="muted">
            Nuestro equipo revisa tus documentos en menos de 24 horas. Te notificamos cuando
            tu cuenta esté activa o si necesitamos algo más.
          </p>
        </div>

        <button className="btn-primary" disabled={!requiredDone} onClick={handleFinish}>
          {requiredDone
            ? 'Enviar y activar cuenta →'
            : `Faltan ${requiredDocs.length - uploadedRequired.length} documentos`}
        </button>

        <button className="btn-ghost" onClick={handleFinish}>
          Guardar y completar más tarde
        </button>
      </div>
    </div>
  )
}
