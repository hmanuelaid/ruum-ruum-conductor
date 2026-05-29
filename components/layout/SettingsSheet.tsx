
// ─── components/layout/SettingsSheet.tsx ─────────────────────────────────────
'use client'

import { useSettings } from '@/lib/store'
import type { DriverDocument } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprobada',
  review:   'En revisión',
  pending:  'Pendiente',
}

interface Props { documents: DriverDocument[] }

export default function SettingsSheet({ documents }: Props) {
  const { open, closeSheet } = useSettings()

  return (
    <div
      className={`sheet-backdrop${open ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) closeSheet() }}
      aria-hidden={!open}
    >
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <h2 id="settingsTitle">Configuración</h2>
          <button className="btn-icon" onClick={closeSheet} aria-label="Cerrar configuración">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div className="settings-group">
          <h3>Cuenta</h3>
          <button className="settings-row">Perfil <span>›</span></button>
          <button className="settings-row">Datos bancarios <span>›</span></button>
        </div>

        <div className="settings-group">
          <h3>Documentos</h3>
          {documents.map((doc) => (
            <button key={doc.id} className="settings-row">
              {doc.name} <span>{STATUS_LABELS[doc.status]}</span>
            </button>
          ))}
        </div>

        <div className="settings-group">
          <h3>Preferencias</h3>
          <button className="settings-row">Notificaciones <span>Activas</span></button>
          <button className="settings-row">Viajes <span>Local / Foráneo</span></button>
          <button className="settings-row">Aplicación <span>›</span></button>
        </div>
      </aside>
    </div>
  )
}
