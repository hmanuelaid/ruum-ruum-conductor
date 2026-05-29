
// ─── components/driver/AvailabilityToggle.tsx ─────────────────────────────────
'use client'

import { useAvailability } from '@/lib/store'
import { Switch } from '@/components/ui/Switch'

export default function AvailabilityToggle() {
  const { available, toggle } = useAvailability()

  return (
    <section className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p className="kicker">Disponibilidad</p>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>
          {available ? 'Disponible' : 'No disponible'}
        </h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 13 }}>
          {available ? 'Listo para recibir viajes' : 'Modo offline activo'}
        </p>
      </div>
      <Switch checked={available} onToggle={toggle} label="Cambiar disponibilidad" />
    </section>
  )
}
