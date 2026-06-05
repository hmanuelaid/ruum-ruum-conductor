'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TripPreferencesCard from '@/components/driver/TripPreferencesCard'
import { DOCUMENT_STATUS_CONFIG } from '@/lib/document-contract'
import { useAppStore, useAuthStore } from '@/lib/store'
import type { DriverAccountSettings, DriverDocument } from '@/lib/types'
import { useDocuments } from '@/lib/useDocuments'
import { useDriverProfile } from '@/lib/useDriverProfile'

type View = 'home' | 'account' | 'documents' | 'preferences'

type AccountApiResponse =
  | { ok: true; data: DriverAccountSettings }
  | { ok: false; error?: string }

const DRIVER_DOCS = [
  { docType: 'ine',          label: 'Identificacion oficial', required: true  },
  { docType: 'licencia',     label: 'Licencia de conducir',   required: true  },
  { docType: 'comprobante',  label: 'Comprobante domicilio',  required: true  },
  { docType: 'antecedentes', label: 'No antecedentes penales', required: true  },
  { docType: 'foto_perfil',  label: 'Foto de perfil',         required: true  },
  { docType: 'curp',         label: 'CURP',                   required: false },
  { docType: 'rfc',          label: 'RFC',                    required: false },
]

const EMPTY_ACCOUNT: DriverAccountSettings = {
  name: '',
  phone: '',
  email: '',
  bank_name: '',
  bank_account_holder: '',
  bank_clabe: '',
}

interface Props { documents?: DriverDocument[] }

function maskClabe(value: string) {
  if (!value) return 'Sin capturar'
  return `•••• ${value.slice(-4)}`
}

function AccountSettings({ open }: { open: boolean }) {
  const { driver, setDriver } = useAuthStore()
  const [account, setAccount] = useState<DriverAccountSettings>(EMPTY_ACCOUNT)
  const [savedAccount, setSavedAccount] = useState<DriverAccountSettings>(EMPTY_ACCOUNT)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const dirty = useMemo(
    () => JSON.stringify(account) !== JSON.stringify(savedAccount),
    [account, savedAccount]
  )

  useEffect(() => {
    if (!open) return

    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      setSaved(false)
      try {
        const res = await fetch('/api/drivers/account', { cache: 'no-store' })
        const payload = await res.json().catch(() => null) as AccountApiResponse | null
        if (!res.ok || !payload?.ok) {
          throw new Error(payload && !payload.ok ? payload.error : 'No se pudo cargar la cuenta.')
        }
        if (!cancelled) {
          setAccount(payload.data)
          setSavedAccount(payload.data)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar la cuenta.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [open])

  function update<K extends keyof DriverAccountSettings>(key: K, value: DriverAccountSettings[K]) {
    setSaved(false)
    setAccount(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/drivers/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      })
      const payload = await res.json().catch(() => null) as AccountApiResponse | null
      if (!res.ok || !payload?.ok) {
        throw new Error(payload && !payload.ok ? payload.error : 'No se pudo guardar la cuenta.')
      }
      setAccount(payload.data)
      setSavedAccount(payload.data)
      setDriver({
        id: driver?.id ?? '',
        name: payload.data.name,
        phone: payload.data.phone,
        email: payload.data.email,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la cuenta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {loading && <p className="muted">Cargando cuenta...</p>}
      {error && (
        <div className="notice notice-warning" style={{ padding: 10 }}>
          <span>!</span>
          <p>{error}</p>
        </div>
      )}
      {saved && <span className="chip chip-success" style={{ width: 'fit-content' }}>Cuenta actualizada</span>}

      <div className="settings-group">
        <h3>Perfil</h3>
        <label className="field-label">Nombre</label>
        <input className="field-input" value={account.name} onChange={e => update('name', e.target.value)} />
        <label className="field-label">Telefono</label>
        <input className="field-input" value={account.phone} onChange={e => update('phone', e.target.value)} />
        <label className="field-label">Correo</label>
        <input className="field-input" value={account.email} onChange={e => update('email', e.target.value)} />
      </div>

      <div className="settings-group">
        <h3>Datos bancarios</h3>
        <label className="field-label">Banco</label>
        <input className="field-input" value={account.bank_name} onChange={e => update('bank_name', e.target.value)} />
        <label className="field-label">Titular</label>
        <input className="field-input" value={account.bank_account_holder} onChange={e => update('bank_account_holder', e.target.value)} />
        <label className="field-label">CLABE</label>
        <input
          className="field-input"
          inputMode="numeric"
          maxLength={18}
          value={account.bank_clabe}
          onChange={e => update('bank_clabe', e.target.value.replace(/\D/g, '').slice(0, 18))}
        />
        <p className="muted">Cuenta para depósitos: {maskClabe(account.bank_clabe)}</p>
      </div>

      <button className="btn-primary" disabled={!dirty || saving || loading} onClick={save}>
        {saving ? 'Guardando...' : dirty ? 'Guardar cuenta' : 'Cuenta al día'}
      </button>
    </div>
  )
}

function DocumentsSettings({ driverId, driverName }: { driverId: string | null; driverName: string }) {
  const router = useRouter()
  const { setSettingsOpen } = useAppStore()
  const { docs, loading } = useDocuments(driverId, DRIVER_DOCS)
  const requiredDocs = docs.filter(doc => doc.required)
  const completed = requiredDocs.filter(doc => doc.status === 'aprobado' || doc.status === 'en_revision').length
  const total = requiredDocs.length

  function openDocs() {
    setSettingsOpen(false)
    router.push('/docs')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ borderRadius: 10 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Expediente</p>
        <p style={{ fontSize: 22, fontWeight: 900 }}>{completed}/{total} requeridos</p>
        <p className="muted">{driverName}</p>
      </div>

      {loading ? (
        <p className="muted">Cargando documentos...</p>
      ) : (
        <div className="settings-group">
          <h3>Documentos</h3>
          {docs.map(doc => {
            const config = DOCUMENT_STATUS_CONFIG[doc.status]
            return (
              <button key={doc.docType} className="settings-row" onClick={openDocs}>
                <span style={{ color: 'var(--text)', fontSize: 14 }}>{doc.label}</span>
                <span style={{ color: config.color }}>{config.label}</span>
              </button>
            )
          })}
        </div>
      )}

      <button className="btn-primary" onClick={openDocs}>Gestionar documentos</button>
    </div>
  )
}

export default function SettingsSheet({ documents: _documents }: Props) {
  const { settingsOpen, setSettingsOpen } = useAppStore()
  const { driver } = useDriverProfile()
  const [view, setView] = useState<View>('home')

  useEffect(() => {
    if (!settingsOpen) setView('home')
  }, [settingsOpen])

  const title =
    view === 'account' ? 'Cuenta'
    : view === 'documents' ? 'Documentos'
    : view === 'preferences' ? 'Preferencias'
    : 'Configuración'

  const driverId = driver?.id ?? null
  const driverName = driver?.name ?? 'Conductor'

  return (
    <div
      className={`sheet-backdrop${settingsOpen ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
      aria-hidden={!settingsOpen}
    >
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {view !== 'home' && (
              <button className="btn-mini" onClick={() => setView('home')} aria-label="Volver">
                ‹
              </button>
            )}
            <h2 id="settingsTitle">{title}</h2>
          </div>
          <button className="btn-icon" onClick={() => setSettingsOpen(false)} aria-label="Cerrar configuración">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {view === 'home' && (
          <>
            <div className="settings-group">
              <h3>Cuenta</h3>
              <button className="settings-row" onClick={() => setView('account')}>Perfil y datos bancarios <span>›</span></button>
            </div>
            <div className="settings-group">
              <h3>Documentos</h3>
              <button className="settings-row" onClick={() => setView('documents')}>Expediente del conductor <span>›</span></button>
            </div>
            <div className="settings-group">
              <h3>Preferencias</h3>
              <button className="settings-row" onClick={() => setView('preferences')}>Viajes <span>Local / Foráneo</span></button>
            </div>
          </>
        )}

        {view === 'account' && <AccountSettings open={settingsOpen && view === 'account'} />}
        {view === 'documents' && <DocumentsSettings driverId={driverId} driverName={driverName} />}
        {view === 'preferences' && <TripPreferencesCard driverId={driver?.id} />}
      </aside>
    </div>
  )
}
