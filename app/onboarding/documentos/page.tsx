'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useAppStore } from '@/lib/store'

const DOCS = [
  { id: 'licencia', label: 'Licencia de conducir', required: true },
  { id: 'ine', label: 'Identificación oficial (INE)', required: true },
  { id: 'seguro', label: 'Póliza de seguro', required: true },
  { id: 'vehiculo', label: 'Tarjeta de circulación', required: true },
  { id: 'foto', label: 'Foto de perfil', required: false },
]

export default function DocumentosPage() {
  const router = useRouter()
  const { setDriver, completeOnboarding } = useAuthStore()
  const { showToast } = useAppStore()
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  function toggle(id: string) {
    setUploaded(u => ({ ...u, [id]: !u[id] }))
  }

  const requiredDone = DOCS.filter(d => d.required).every(d => uploaded[d.id])

  async function handleFinish() {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))

    const raw = typeof window !== 'undefined'
      ? sessionStorage.getItem('reg_data') : null
    const reg = raw ? JSON.parse(raw) : {}

    setDriver({
      id: 'drv_' + Date.now(),
      name: reg.name ?? 'Conductor',
      phone: reg.phone ?? '',
      email: reg.email ?? '',
    })
    completeOnboarding()
    showToast('¡Registro completado! Tus docs están en revisión.')
    router.replace('/panel')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>
      <div className="onboarding-card">
        <div className="step-badge">Paso 3 de 3</div>
        <h1 className="onboarding-title">Sube tus documentos</h1>
        <p className="onboarding-sub">
          Los revisaremos en 24 h. Puedes subir los opcionales después.
        </p>

        <div className="doc-list">
          {DOCS.map(doc => (
            <div
              key={doc.id}
              className={`doc-row ${uploaded[doc.id] ? 'doc-done' : ''}`}
              onClick={() => toggle(doc.id)}
            >
              <span className="doc-icon">{uploaded[doc.id] ? '✓' : '↑'}</span>
              <span className="doc-label">{doc.label}</span>
              {!doc.required && <span className="doc-opt">Opcional</span>}
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          disabled={!requiredDone || submitting}
          onClick={handleFinish}
        >
          {submitting ? 'Enviando…' : 'Finalizar registro'}
        </button>

        {!requiredDone && (
          <p className="field-error">Sube los documentos obligatorios para continuar</p>
        )}
      </div>
    </div>
  )
}