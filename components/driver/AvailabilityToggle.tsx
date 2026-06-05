'use client'
import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/Switch'
import { useAppStore } from '@/lib/store'

type AvailStatus = 'disponible' | 'no_disponible' | 'en_viaje' | 'pausado'

type AvailApiResponse =
  | { ok: true; data: { available: boolean; status: AvailStatus } }
  | { ok: false; error?: string }

const STATUS_LABEL: Record<AvailStatus, string> = {
  disponible:    'Disponible',
  no_disponible: 'No disponible',
  en_viaje:      'En viaje',
  pausado:       'Pausado',
}

const STATUS_SUB: Record<AvailStatus, string> = {
  disponible:    'Listo para recibir viajes',
  no_disponible: 'Modo offline activo',
  en_viaje:      'Actualmente en traslado',
  pausado:       'Disponibilidad pausada',
}

export default function AvailabilityToggle() {
  const { available, setAvailable } = useAppStore()
  const [status, setStatus] = useState<AvailStatus>(available ? 'disponible' : 'no_disponible')
  const [loading, setLoading] = useState(false)

  // Sincronizar con el servidor al montar
  useEffect(() => {
    void fetchAvailability()
  }, [])

  async function fetchAvailability() {
    try {
      const res = await fetch('/api/drivers/availability', { cache: 'no-store' })
      const payload = await res.json().catch(() => null) as AvailApiResponse | null
      if (payload?.ok) {
        setAvailable(payload.data.available)
        setStatus(payload.data.status)
      }
    } catch {
      // silently keep local state
    }
  }

  async function handleToggle() {
    if (loading || status === 'en_viaje') return
    const nextStatus: AvailStatus = status === 'disponible' ? 'no_disponible' : 'disponible'
    setLoading(true)
    try {
      const res = await fetch('/api/drivers/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const payload = await res.json().catch(() => null) as AvailApiResponse | null
      if (payload?.ok) {
        setAvailable(payload.data.available)
        setStatus(payload.data.status)
      }
    } catch {
      // silently keep current state
    } finally {
      setLoading(false)
    }
  }

  const isActive = status === 'disponible'
  const isInTrip  = status === 'en_viaje'

  return (
    <section
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeft: `3px solid ${isInTrip ? 'var(--warning)' : isActive ? 'var(--success)' : 'var(--border)'}`,
        opacity: loading ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <div>
        <p className="kicker">Disponibilidad</p>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>
          {STATUS_LABEL[status]}
        </h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 13 }}>
          {STATUS_SUB[status]}
        </p>
      </div>
      <Switch
        checked={isActive}
        onToggle={handleToggle}
        label="Cambiar disponibilidad"
      />
    </section>
  )
}
