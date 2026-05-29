

// ════════════════════════════════════════════════════════════════════
// app/(driver)/ganancias/page.tsx
// ════════════════════════════════════════════════════════════════════
import { mockEarnings } from '@/lib/mock-data'

export default function GananciasPage() {
  const { availableMXN, payoutDay, movements } = mockEarnings

  return (
    <>
      <article className="earnings-hero">
        <p className="kicker">Ganancia disponible</p>
        <strong>${availableMXN.toLocaleString('es-MX')}</strong>
        <span>Se deposita el {payoutDay}</span>
      </article>

      <section>
        <div className="section-head">
          <h2>Movimientos</h2>
          <button className="btn-text">Exportar</button>
        </div>
        <div className="stack">
          {movements.map(mv => (
            <article key={mv.id} className="list-card">
              <div>
                <small>{mv.dateLabel}</small>
                <strong>{mv.label}</strong>
                <p>{mv.sublabel}</p>
              </div>
              <b style={{ color: mv.amountMXN < 0 ? 'var(--muted)' : 'var(--success)', whiteSpace: 'nowrap' }}>
                {mv.amountMXN > 0 ? '+' : ''}${Math.abs(mv.amountMXN).toLocaleString('es-MX')}
              </b>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

