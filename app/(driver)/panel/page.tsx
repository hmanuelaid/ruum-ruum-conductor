'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import { useDriverProfile } from '@/lib/useDriverProfile'
import { usePanelSummary } from '@/lib/usePanelSummary'
import AvailabilityToggle from '@/components/driver/AvailabilityToggle'
import WeeklyMetrics from '@/components/driver/WeeklyMetrics'
import CameraUpload from '@/components/ui/CameraUpload'

interface ActiveTrip {
  id: string
  status: string
  origin_address: string | null
  origin_reference: string | null
  origin_contact_name: string | null
  origin_contact_phone: string | null
  destination_address: string | null
  destination_reference: string | null
  dest_contact_name: string | null
  dest_contact_phone: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_year: number | null
  vehicle_color: string | null
  vehicle_plates: string | null
  vehicle_condition: string | null
  driver_pay_mxn: number | null
  distance_km: number | null
}

type TripsApiResponse =
  | { ok: true; data: ActiveTrip[] }
  | { ok: false; error?: string }

type TripApiResponse =
  | { ok: true; data: ActiveTrip }
  | { ok: false; error?: string }

const STATUS_LABELS: Record<string, string> = {
  conductor_asignado:         'Conductor asignado',
  conductor_en_camino:        'En camino al origen',
  recoleccion_proceso:        'Recolección en proceso',
  evidencia_inicial_pendiente:'Evidencia inicial pendiente',
  traslado_curso:             'Traslado en curso',
  entrega_proceso:            'Entrega en proceso',
  evidencia_final_pendiente:  'Evidencia final pendiente',
  finalizado:                 'Finalizado',
}

const ACTIVE_STATUSES = new Set([
  'conductor_asignado', 'conductor_en_camino', 'recoleccion_proceso',
  'evidencia_inicial_pendiente', 'traslado_curso',
  'entrega_proceso', 'evidencia_final_pendiente',
])

export default function PanelPage() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const { driver, loading: driverLoading } = useDriverProfile()
  const { summary } = usePanelSummary(driver?.id)

  const [trip, setTrip] = useState<ActiveTrip | null>(null)
  const [tripLoading, setTripLoading] = useState(false)
  const [tripError, setTripError] = useState('')
  const [statusError, setStatusError] = useState('')

  // Saludo por hora
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    if (!driver) {
      setTrip(null)
      setTripLoading(false)
      setTripError('')
      return
    }

    let cancelled = false

    async function loadActiveTrip() {
      setTripLoading(true)
      setTripError('')

      try {
        const response = await fetch('/api/trips', { cache: 'no-store' })
        const payload = await response.json().catch(() => null) as TripsApiResponse | null

        if (!response.ok || !payload?.ok) {
          const msg = payload && !payload.ok ? payload.error : null
          throw new Error(msg ?? 'No se pudo cargar el viaje activo.')
        }

        const activeTrip = payload.data.find(item => ACTIVE_STATUSES.has(item.status)) ?? null
        if (!cancelled) setTrip(activeTrip)
      } catch (err) {
        if (!cancelled) {
          setTrip(null)
          setTripError(err instanceof Error ? err.message : 'No se pudo cargar el viaje activo.')
        }
      } finally {
        if (!cancelled) setTripLoading(false)
      }
    }

    void loadActiveTrip()
    return () => { cancelled = true }
  }, [driver])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  async function updateStatus(newStatus: string) {
    if (!driver || !trip) return
    setStatusError('')

    try {
      const response = await fetch(`/api/trips/${encodeURIComponent(trip.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const payload = await response.json().catch(() => null) as TripApiResponse | null

      if (!response.ok || !payload?.ok) {
        const msg = payload && !payload.ok ? payload.error : null
        throw new Error(msg ?? 'No se pudo actualizar el estatus.')
      }

      setTrip(payload.data)
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'No se pudo actualizar el estatus.')
    }
  }

  if (driverLoading || tripLoading) return (
    <div style={{ padding: 24 }}>
      <p className="muted">Cargando panel…</p>
    </div>
  )

  if (!driver) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="muted" style={{ fontSize: 12 }}>{greeting},</p>
          <p style={{ fontSize: 20, fontWeight: 800 }}>{driver.name}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 14px', borderRadius: 8,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text)', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span>🚪</span> Salir
        </button>
      </div>

      {/* ── Disponibilidad (Sprint 1) ── */}
      <AvailabilityToggle />

      {/* ── Resumen semanal (Sprint 1) ── */}
      {summary && <WeeklyMetrics earnings={summary} />}

      {/* ── Error de viaje ── */}
      {tripError && (
        <div className="card" style={{ color: 'var(--danger)', fontSize: 14 }}>{tripError}</div>
      )}

      {/* ── Viaje activo o estado vacío ── */}
      {!trip ? (
        <div style={{
          padding: '28px 20px', textAlign: 'center',
          background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>🟢</p>
          <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Sin viaje activo</p>
          <p className="muted" style={{ fontSize: 13 }}>
            Revisa la pestaña Viajes para aceptar traslados disponibles.
          </p>
        </div>
      ) : (
        <>
          {/* Banner viaje activo */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
            borderRadius: 14, padding: '20px 18px', color: '#fff',
          }}>
            <p style={{ fontSize: 11, opacity: .75, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Viaje activo</p>
            <p style={{ fontSize: 13, fontFamily: 'monospace', opacity: .85, marginBottom: 4 }}>{trip.id}</p>
            <p style={{ fontSize: 18, fontWeight: 800 }}>{STATUS_LABELS[trip.status] ?? trip.status}</p>
          </div>

          {/* Ruta */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Ruta</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 3 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ width: 1, height: 28, background: 'var(--border)' }} />
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', flexShrink: 0 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Origen</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{trip.origin_address}</p>
                  {trip.origin_reference && <p className="muted">{trip.origin_reference}</p>}
                  <p className="muted">{trip.origin_contact_name} · {trip.origin_contact_phone}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Destino</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{trip.destination_address}</p>
                  {trip.destination_reference && <p className="muted">{trip.destination_reference}</p>}
                  <p className="muted">{trip.dest_contact_name} · {trip.dest_contact_phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehículo */}
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Vehículo</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🚗</span>
              <div>
                <p style={{ fontWeight: 700 }}>{trip.vehicle_brand} {trip.vehicle_model} {trip.vehicle_year}</p>
                <p className="muted">{trip.vehicle_color} · {trip.vehicle_plates}</p>
                <p className="muted">{trip.vehicle_condition}</p>
              </div>
            </div>
          </div>

          {/* Pago estimado */}
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Pago estimado</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--success)' }}>
              ${Number(trip.driver_pay_mxn).toLocaleString('es-MX')}
            </p>
            <p className="muted" style={{ marginTop: 4 }}>
              ~{trip.distance_km} km · Tarifa estándar
            </p>
          </div>

          {/* Actualizar estatus */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Actualizar estatus</p>
            {statusError && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{statusError}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { status: 'conductor_en_camino',         label: '🚗 En camino al origen' },
                { status: 'recoleccion_proceso',          label: '📋 Recolección en proceso' },
                { status: 'evidencia_inicial_pendiente',  label: '📸 Subir evidencia inicial' },
                { status: 'traslado_curso',               label: '🛣️ Iniciar traslado' },
                { status: 'entrega_proceso',              label: '📦 Entrega en proceso' },
                { status: 'evidencia_final_pendiente',    label: '📸 Subir evidencia final' },
                { status: 'finalizado',                   label: '✅ Marcar como finalizado' },
              ].map(({ status, label }) => (
                <button key={status}
                  onClick={() => updateStatus(status)}
                  style={{
                    padding: '11px 14px', borderRadius: 10, textAlign: 'left',
                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    background: trip.status === status ? 'var(--primary-dim)' : 'var(--surface-2)',
                    border: `1px solid ${trip.status === status ? 'var(--primary)' : 'var(--border)'}`,
                    color: 'var(--text)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {trip.status === 'evidencia_inicial_pendiente' && (
              <CameraUpload
                tripId={trip.id}
                type="pickup"
                onUploadComplete={() => updateStatus('traslado_curso')}
              />
            )}

            {trip.status === 'evidencia_final_pendiente' && (
              <CameraUpload
                tripId={trip.id}
                type="delivery"
                onUploadComplete={() => updateStatus('finalizado')}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
