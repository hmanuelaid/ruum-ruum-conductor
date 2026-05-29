'use client'
import { Chip } from '@/components/ui/Chip'
import { useAppStore } from '@/lib/store'

export default function SoportePage() {
  const { showToast } = useAppStore()

  return (
    <>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>¿Necesitas ayuda?</h2>
        <p className="muted">Elige una opción para contactar al equipo operativo de Ruum Ruum.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-primary" onClick={() => showToast('Conectando con soporte...')}>
            <span>Iniciar chat</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>
            </svg>
          </button>
          <button className="btn-secondary">Llamar soporte</button>
        </div>
      </section>

      <div className="stack">
        <article className="list-card">
          <div>
            <small>FAQs</small>
            <strong>Cierre de viaje</strong>
            <p>Evidencias, pagos y reportes.</p>
          </div>
          <button className="btn-mini" aria-label="Abrir FAQs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
              <path d="M9 18 15 12 9 6"/>
            </svg>
          </button>
        </article>
        <article className="list-card">
          <div>
            <small>Emergencia</small>
            <strong>Asistencia en ruta</strong>
            <p>Respuesta prioritaria 24/7.</p>
          </div>
          <Chip variant="danger">SOS</Chip>
        </article>
      </div>
    </>
  )
}
