
// ─── components/driver/DriverCard.tsx ─────────────────────────────────────────
import { Chip } from '@/components/ui/Chip'
import type { Driver } from '@/lib/types'

export default function DriverCard({ driver }: { driver: Driver }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <article className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent)', display: 'grid', placeItems: 'center',
          fontSize: 20, fontWeight: 800, flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {driver.avatar}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="muted">{greeting}</p>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>{driver.name}</h2>
        {driver.certified && <Chip variant="success">Conductor certificado</Chip>}
      </div>
      <div
        style={{ textAlign: 'center', flexShrink: 0 }}
        aria-label={`Calificación ${driver.rating}`}
      >
        <strong style={{ fontSize: 22, fontWeight: 800, display: 'block' }}>{driver.rating}</strong>
        <span className="muted" style={{ fontSize: 11 }}>rating</span>
      </div>
    </article>
  )
}
