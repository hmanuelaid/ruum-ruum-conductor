
// ─── components/trip/TripSheet.tsx ────────────────────────────────────────────
'use client'

import { useActiveTrip, useToast } from '@/lib/store'
import { useRef } from 'react'

export default function TripSheet() {
  const { trip, step, sheetOpen, closeSheet, setStep } = useActiveTrip()
  const { show } = useToast()
  const photoRef  = useRef<HTMLInputElement>(null)
  const receiptRef = useRef<HTMLInputElement>(null)

  if (!trip) return null

  const handleArrived = () => {
    setStep('arrived')
    setStep('evidence')
  }

  const handleFinish = () => {
    show('Viaje cerrado correctamente ✓')
    setStep('closed')
    closeSheet()
  }

  return (
    <div
      className={`sheet-backdrop${sheetOpen ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) closeSheet() }}
      aria-hidden={!sheetOpen}
    >
      <aside className="sheet trip-sheet" role="dialog" aria-modal="true" aria-labelledby="tripTitle">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="kicker">Viaje {trip.id}</p>
            <h2 id="tripTitle">Dirígete a destino</h2>
          </div>
          <button className="btn-icon" onClick={closeSheet} aria-label="Cerrar panel de viaje">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Map preview */}
        <div className="map-preview" aria-label="Mapa de ruta">
          <div className="map-path" />
          <span className="pin start">{trip.origin.address.split(',')[0]}</span>
          <span className="pin end">{trip.destination.address.split(',')[0]}</span>
        </div>

        {/* Navigation buttons */}
        <div className="action-grid">
          <a
            className="btn-secondary"
            href={`https://www.google.com/maps/dir/${encodeURIComponent(trip.origin.address)}/${encodeURIComponent(trip.destination.address)}`}
            target="_blank" rel="noreferrer"
          >
            Google Maps
          </a>
          <a
            className="btn-secondary"
            href={`https://waze.com/ul?q=${encodeURIComponent(trip.destination.address)}&navigate=yes`}
            target="_blank" rel="noreferrer"
          >
            Waze
          </a>
        </div>

        {/* Steps */}
        <ol className="trip-steps">
          <li className="done"><span /><span>Inicio confirmado</span></li>
          <li className={step === 'en-route' ? 'active' : 'done'}><span /><span>En camino al destino</span></li>
          <li className={step === 'evidence' || step === 'closed' ? 'done' : step === 'arrived' ? 'active' : ''}>
            <span /><span>Cargar evidencia final</span>
          </li>
        </ol>

        {step === 'en-route' && (
          <button className="btn-primary" onClick={handleArrived}>
            <span>Llegué al destino</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </button>
        )}

        {(step === 'evidence' || step === 'arrived') && (
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
        )}
      </aside>
    </div>
  )
}