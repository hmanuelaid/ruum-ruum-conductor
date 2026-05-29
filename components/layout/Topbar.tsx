'use client'

import { usePathname } from 'next/navigation'
import { useSettings } from '@/lib/store'
import type { Driver } from '@/lib/types'

const SCREEN_TITLES: Record<string, string> = {
  '/panel':    'Panel',
  '/viajes':   'Viajes',
  '/ganancias':'Ganancias',
  '/docs':     'Documentos',
  '/soporte':  'Soporte',
}

interface Props { driver: Driver }

export default function TopBar({ driver }: Props) {
  const pathname = usePathname()
  const { openSheet } = useSettings()
  const title = SCREEN_TITLES[pathname] ?? 'Panel'

  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo-mark" aria-hidden="true">R</div>
        <div>
          <p className="eyebrow">Ruum Ruum</p>
          <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Notifications */}
        <button className="btn-icon dot-badge" aria-label="Ver alertas">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
            <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
          </svg>
        </button>
        {/* Settings */}
        <button className="btn-icon" aria-label="Abrir configuración" onClick={openSheet}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
            <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 1 1-2.98 2.98l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V21a2.1 2.1 0 1 1-4.2 0v-.06a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.04.04a2.1 2.1 0 1 1-2.98-2.98l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.66-1.1H2.9a2.1 2.1 0 1 1 0-4.2h.06A1.8 1.8 0 0 0 4.62 8.6a1.8 1.8 0 0 0-.36-1.98l-.04-.04A2.1 2.1 0 1 1 7.2 3.6l.04.04a1.8 1.8 0 0 0 1.98.36h.02a1.8 1.8 0 0 0 1.08-1.66V2.3a2.1 2.1 0 1 1 4.2 0v.06A1.8 1.8 0 0 0 15.6 4h.02a1.8 1.8 0 0 0 1.98-.36l.04-.04a2.1 2.1 0 1 1 2.98 2.98l-.04.04A1.8 1.8 0 0 0 19.4 8.6v.02a1.8 1.8 0 0 0 1.66 1.08h.06a2.1 2.1 0 1 1 0 4.2h-.06A1.8 1.8 0 0 0 19.4 15Z"/>
          </svg>
        </button>
      </div>
    </header>
  )
}