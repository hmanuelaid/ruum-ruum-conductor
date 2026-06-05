'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DriverShiftPreference, DriverTripPreferences } from '@/lib/types'

type PreferencesApiResponse =
  | { ok: true; data: DriverTripPreferences }
  | { ok: false; error?: string }

const DEFAULT_PREFERENCES: DriverTripPreferences = {
  preferred_zones: [],
  max_trip_distance_km: 25,
  minimum_trip_pay_mxn: 350,
  preferred_shift: 'mixto',
  accepts_long_distance: true,
}

const ZONE_OPTIONS = ['CDMX', 'Norte', 'Sur', 'Poniente', 'Oriente', 'Aeropuerto', 'Toluca', 'Querétaro']

const SHIFT_OPTIONS: { key: DriverShiftPreference; label: string }[] = [
  { key: 'manana', label: 'Mañana' },
  { key: 'tarde', label: 'Tarde' },
  { key: 'noche', label: 'Noche' },
  { key: 'mixto', label: 'Mixto' },
]

export default function TripPreferencesCard({ driverId }: { driverId: string | undefined }) {
  const [prefs, setPrefs] = useState<DriverTripPreferences>(DEFAULT_PREFERENCES)
  const [savedPrefs, setSavedPrefs] = useState<DriverTripPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const dirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(savedPrefs),
    [prefs, savedPrefs]
  )

  useEffect(() => {
    if (!driverId) return

    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/drivers/preferences', { cache: 'no-store' })
        const payload = await res.json().catch(() => null) as PreferencesApiResponse | null
        if (!res.ok || !payload?.ok) {
          throw new Error(payload && !payload.ok ? payload.error : 'No se pudieron cargar preferencias.')
        }
        if (!cancelled) {
          setPrefs(payload.data)
          setSavedPrefs(payload.data)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudieron cargar preferencias.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [driverId])

  function toggleZone(zone: string) {
    setSaved(false)
    setPrefs(prev => ({
      ...prev,
      preferred_zones: prev.preferred_zones.includes(zone)
        ? prev.preferred_zones.filter(item => item !== zone)
        : [...prev.preferred_zones, zone],
    }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/drivers/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      const payload = await res.json().catch(() => null) as PreferencesApiResponse | null
      if (!res.ok || !payload?.ok) {
        throw new Error(payload && !payload.ok ? payload.error : 'No se pudieron guardar preferencias.')
      }
      setPrefs(payload.data)
      setSavedPrefs(payload.data)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar preferencias.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card" aria-label="Preferencias de viaje" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Preferencias</p>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Viajes que quieres recibir</h2>
        </div>
        {loading && <span className="chip chip-neutral">Cargando</span>}
        {saved && <span className="chip chip-success">Guardado</span>}
      </div>

      {error && (
        <div className="notice notice-warning" style={{ padding: 10 }}>
          <span>!</span>
          <p>{error}</p>
        </div>
      )}

      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Zonas</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ZONE_OPTIONS.map(zone => {
            const active = prefs.preferred_zones.includes(zone)
            return (
              <button
                key={zone}
                type="button"
                onClick={() => toggleZone(zone)}
                style={{
                  padding: '7px 10px', borderRadius: 999, border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  background: active ? 'var(--primary-dim)' : 'var(--surface-2)',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {zone}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Turno</p>
        <div className="segmented" style={{ background: 'var(--surface-2)' }}>
          {SHIFT_OPTIONS.map(option => (
            <button
              key={option.key}
              type="button"
              className={prefs.preferred_shift === option.key ? 'active' : ''}
              onClick={() => {
                setSaved(false)
                setPrefs(prev => ({ ...prev, preferred_shift: option.key }))
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12 }}>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Radio máximo</span>
          <strong style={{ fontSize: 18 }}>{prefs.max_trip_distance_km} km</strong>
          <input
            type="range"
            min={5}
            max={300}
            step={5}
            value={prefs.max_trip_distance_km}
            onChange={e => {
              setSaved(false)
              setPrefs(prev => ({ ...prev, max_trip_distance_km: Number(e.target.value) }))
            }}
            style={{ width: '100%', marginTop: 8 }}
          />
        </label>
        <label style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12 }}>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Pago mínimo</span>
          <strong style={{ fontSize: 18 }}>${prefs.minimum_trip_pay_mxn}</strong>
          <input
            type="range"
            min={0}
            max={10000}
            step={50}
            value={prefs.minimum_trip_pay_mxn}
            onChange={e => {
              setSaved(false)
              setPrefs(prev => ({ ...prev, minimum_trip_pay_mxn: Number(e.target.value) }))
            }}
            style={{ width: '100%', marginTop: 8 }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700 }}>Viajes foráneos</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Recibir traslados fuera de tu zona principal</p>
        </div>
        <button
          type="button"
          className={`switch-track${prefs.accepts_long_distance ? ' on' : ''}`}
          aria-pressed={prefs.accepts_long_distance}
          onClick={() => {
            setSaved(false)
            setPrefs(prev => ({ ...prev, accepts_long_distance: !prev.accepts_long_distance }))
          }}
        >
          <span className="switch-thumb" />
        </button>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={save}
        disabled={!dirty || saving || loading}
        style={{ padding: '12px 16px' }}
      >
        {saving ? 'Guardando...' : dirty ? 'Guardar preferencias' : 'Preferencias al día'}
      </button>
    </section>
  )
}
