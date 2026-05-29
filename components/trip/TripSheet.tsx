'use client'
import { useAppStore } from '@/lib/store'
import { useRef } from 'react'

export default function TripSheet() {
  const { activeTrip, setActiveTrip, showToast } = useAppStore()
  const photoRef   = useRef<HTMLInputElement>(null)
  const receiptRef = useRef<HTMLInputElement>(null)

  const isOpen = !!activeTrip

  const handleFinish = () => {
    showToast('Viaje cerrado correctamente ✓')
    setActiveTrip(null)
  }

  return (
    <div
      className={`sheet-backdrop${isOpen ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) setActiveTrip(null) }}
      aria-hidden={!isOpen}
    >
      <aside className="sheet trip-sheet" role="dialog" aria-modal="true" aria-labelledby="tripTitle">
        <div className="sheet-handle" aria-hidden="true" />

        {activeTrip && (
          <>
            <div className="sheet-header">
              <div>
                <p className="kicker">Viaje {activeTrip.id}</p>
                <h2 id="tripTitle">Dirígete a destino</h2>
              </div>
              <button className="btn-icon" onClick={() => setActiveTrip(null)} aria-label="Cerrar panel de viaje">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <div className="map-preview" aria-label="Mapa de ruta">
              <div className="map-path" />
              <span className="pin start">{activeTrip.origin.address.split(',')[0]}</span>
              <span className="pin end">{activeTrip.destination.address.split(',')[0]}</span>
            </div>

            <div className="action-grid">
              <a className="btn-secondary"
                href={`https://www.google.com/maps/dir/${encodeURIComponent(activeTrip.origin.address)}/${encodeURIComponent(activeTrip.destination.address)}`}
                target="_blank" rel="noreferrer">
                Google Maps
              </a>
              <a className="btn-secondary"
                href={`https://waze.com/ul?q=${encodeURIComponent(activeTrip.destination.address)}&navigate=yes`}
                target="_blank" rel="noreferrer">
                Waze
              </a>
            </div>

           <ol className="trip-steps">
  <li className="done">
    <span aria-hidden="true" />
    <span>Inicio confirmado</span>
  </li>
  <li className="active">
    <span aria-hidden="true" />
    <span>En camino al destino</span>
  </li>
  <li>
    <span aria-hidden="true" />
    <span>Cargar evidencia final</span>
  </li>
</ol>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Evidencia de cierre</h3>
              <label className="upload-tile">
                <input ref={photoRef} type="file" accept="image/*" />
                <span>Foto del vehículo</span>
                <strong>Subir imagen</strong>
              </label>
              <label className="upload-tile">
                <input ref={receiptRef} type="file" accept="image/*" />
                <span>Comprobante final</span>
                <strong>Subir imagen</strong>
              </label>
              <button className="btn-primary" onClick={handleFinish}>Cerrar viaje</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

