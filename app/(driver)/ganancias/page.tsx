'use client'
import { useEffect, useState } from 'react'
import { useDriverProfile } from '@/lib/useDriverProfile'

interface EarningRow {
  id: string
  driver_pay_mxn: number | null
  distance_km: number | null
  status: string
  origin_address: string | null
  destination_address: string | null
  created_at: string
}

type TripsApiResponse =
  | { ok: true; data: EarningRow[] }
  | { ok: false; error?: string }

export default function GananciasPage() {
  const { driver, loading: driverLoading } = useDriverProfile()
  const [trips, setTrips] = useState<EarningRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!driver) {
      setTrips([])
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false

    async function loadEarnings() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/trips', { cache: 'no-store' })
        const payload = await response.json().catch(() => null) as TripsApiResponse | null

        if (!response.ok || !payload?.ok) {
          const errorMessage = payload && !payload.ok ? payload.error : null
          throw new Error(errorMessage ?? 'No se pudieron cargar tus ganancias.')
        }

        if (!cancelled) setTrips(payload.data)
      } catch (loadError) {
        if (!cancelled) {
          setTrips([])
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus ganancias.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadEarnings()

    return () => {
      cancelled = true
    }
  }, [driver])

  const finalizados = trips.filter(t => t.status === 'finalizado')
  const totalGanado = finalizados.reduce((s, t) => s + Number(t.driver_pay_mxn ?? 0), 0)
  const totalKm = finalizados.reduce((s, t) => s + Number(t.distance_km ?? 0), 0)

  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 7)
  const semanaTrips = finalizados.filter(t => new Date(t.created_at) >= thisWeek)
  const semanaTotal = semanaTrips.reduce((s, t) => s + Number(t.driver_pay_mxn ?? 0), 0)

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>Ganancias</h1>

      {driverLoading || loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Cargando…</p>
      ) : error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>
      ) : (
        <>
          {/* Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Total ganado',      value: `$${totalGanado.toLocaleString('es-MX')}`,  color: 'var(--success)' },
              { label: 'Esta semana',       value: `$${semanaTotal.toLocaleString('es-MX')}`,  color: 'var(--primary)' },
              { label: 'Viajes finalizados',value: finalizados.length,                          color: 'var(--accent)' },
              { label: 'Km recorridos',     value: `${totalKm.toLocaleString('es-MX')} km`,    color: 'var(--warning)' },
            ].map(m => (
              <div key={m.label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 16,
              }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Historial */}
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Historial de viajes</p>
            {finalizados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 24, marginBottom: 8 }}>💰</p>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin ganancias aún</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Tus viajes finalizados aparecerán aquí.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {finalizados.map(t => (
                  <div key={t.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: 14,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{t.id}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {t.origin_address?.split(',')[0]} → {t.destination_address?.split(',')[0]}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(t.created_at).toLocaleDateString('es-MX')} · {t.distance_km} km
                      </p>
                    </div>
                    <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--success)' }}>
                      ${Number(t.driver_pay_mxn).toLocaleString('es-MX')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
