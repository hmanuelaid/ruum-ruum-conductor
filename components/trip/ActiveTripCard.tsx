'use client'

import { useActiveTrip } from '@/lib/store'
import type { Trip } from '@/lib/types'

export default function ActiveTripCard({ trip }: { trip: Trip }) {
  const { setTrip, openSheet } = useActiveTrip()

  const handleOpen = () => {
    setTrip(trip)
    openSheet()
  }

  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="muted" style={{ fontSize: 12 }}>Viaje ID · {trip.id}</span>
        <strong style={{ fontSize: 13, color: 'var(--warning)' }}>En curso</strong>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} aria-hidden="true" />
          <div>
            <small className="muted" style={{ fontSize: 11 }}>{trip.origin.label}</small>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{trip.origin.address}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', flexShrink: 0, marginTop: 4 }} aria-hidden="true" />
          <div>
            <small className="muted" style={{ fontSize: 11 }}>{trip.destination.label}</small>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{trip.destination.address}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--text)' }}>{trip.etaMin} min</strong> ETA</span>
        <span><strong style={{ color: 'var(--text)' }}>${trip.estimatedMXN.toLocaleString('es-MX')}</strong> estimado</span>
        <span><strong style={{ color: 'var(--text)' }}>{trip.distanceKm} km</strong> ruta</span>
      </div>

      {/* CTA */}
      <button className="btn-primary" onClick={handleOpen}>
        <span>Dirígete a destino</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
          <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
        </svg>
      </button>
    </article>
  )
}