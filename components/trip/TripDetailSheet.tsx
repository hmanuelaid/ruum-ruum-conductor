'use client'
import { useAppStore } from '@/lib/store'

const STEPS = [
  'Inicio confirmado',
  'En camino al origen',
  'Vehículo recibido',
  'Evidencia inicial cargada',
  'Traslado iniciado',
  'Traslado en curso',
  'Llegando a destino',
  'Evidencia final',
  'Entrega confirmada',
]

export default function TripDetailSheet() {
  const { activeTrip, setActiveTrip, showToast } = useAppStore()
  const isOpen = !!activeTrip

  function handleCloseTrip() {
    showToast('Viaje cerrado correctamente ✓')
    setActiveTrip(null)
  }

  return (
    <div
      className={`sheet-backdrop${isOpen ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) setActiveTrip(null) }}
      aria-hidden={!isOpen}
    >
      <aside className="sheet" role="dialog" aria-modal="true"
        style={{ gap: 20, paddingBottom: 40 }}>
        <div className="sheet-handle" />

        {activeTrip && (
          <>
            {/* Header */}
            <div className="sheet-header">
              <div>
                <p className="kicker">Viaje {activeTrip.id}</p>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>En curso</h2>
              </div>
              <button className="btn-icon" onClick={() => setActiveTrip(null)} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width={18} height={18} fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            {/* Stats del viaje */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'ETA', value: `${activeTrip.etaMin} min` },
                { label: 'Distancia', value: `${activeTrip.distanceKm} km` },
                { label: 'Estimado', value: `$${activeTrip.estimatedMXN.toLocaleString('es-MX')}` },
              ].map(({ label, value }) => (
                <div key={label} className="metric-card">
                  <p className="value" style={{ fontSize: '1.1rem' }}>{value}</p>
                  <p className="label">{label}</p>
                </div>
              ))}
            </div>

            {/* Ruta */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="kicker">Ruta</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                  <div style={{ width: 2, height: 36, background: 'var(--border)' }} />
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--success)', flexShrink: 0 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{activeTrip.origin.label}</p>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{activeTrip.origin.address}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{activeTrip.destination.label}</p>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{activeTrip.destination.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navegación */}
            <div className="action-grid">
              <a className="btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeTrip.destination.address)}`}
                target="_blank" rel="noreferrer">
                🗺️ Google Maps
              </a>
              <a className="btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}
                href={`https://waze.com/ul?q=${encodeURIComponent(activeTrip.destination.address)}&navigate=yes`}
                target="_blank" rel="noreferrer">
                🚦 Waze
              </a>
            </div>

            {/* Pasos del traslado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p className="kicker" style={{ marginBottom: 8 }}>Pasos del traslado</p>
              <ol className="timeline">
                {STEPS.map((label, i) => {
                  const done   = i < 5
                  const active = i === 5
                  return (
                    <li key={i} className={`timeline-item${done ? ' done' : ''}`}>
                      <div className={`timeline-dot${active ? ' active' : done ? ' done' : ''}`}>
                        {done && (
                          <svg viewBox="0 0 24 24" width={10} height={10} fill="none"
                            stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                        )}
                      </div>
                      <p className="timeline-label" style={{
                        fontWeight: active ? 700 : done ? 500 : 400,
                        color: active ? 'var(--primary)' : done ? 'var(--text)' : 'var(--text-muted)',
                      }}>{label}</p>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Evidencia de cierre */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 15 }}>Evidencia de cierre</p>
              <label className="upload-tile">
                <input type="file" accept="image/*" />
                <span>Foto exterior del vehículo</span>
                <strong>Subir imagen</strong>
              </label>
              <label className="upload-tile">
                <input type="file" accept="image/*" />
                <span>Comprobante de entrega</span>
                <strong>Subir imagen</strong>
              </label>
            </div>

            <button className="btn-primary" onClick={handleCloseTrip}>
              ✓ Cerrar viaje
            </button>
          </>
        )}
      </aside>
    </div>
  )
}