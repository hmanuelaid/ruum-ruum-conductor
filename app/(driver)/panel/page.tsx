'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import { useDriverProfile } from '@/lib/useDriverProfile'
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
  conductor_asignado: 'Conductor asignado', conductor_en_camino: 'En camino al origen',
  recoleccion_proceso: 'Recolección en proceso', evidencia_inicial_pendiente: 'Evidencia inicial pendiente',
  traslado_curso: 'Traslado en curso', entrega_proceso: 'Entrega en proceso',
  evidencia_final_pendiente: 'Evidencia final pendiente', finalizado: 'Finalizado',
}

export default function PanelPage() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const { driver, loading: driverLoading } = useDriverProfile()
  const [trip, setTrip] = useState<ActiveTrip | null>(null)
  const [tripLoading, setTripLoading] = useState(false)
  const [tripError, setTripError] = useState('')
  const [statusError, setStatusError] = useState('')

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
          const errorMessage = payload && !payload.ok ? payload.error : null
          throw new Error(errorMessage ?? 'No se pudo cargar el viaje activo.')
        }

        const activeTrip = payload.data.find(item => item.status !== 'finalizado' && item.status !== 'cancelado') ?? null

        if (!cancelled) setTrip(activeTrip)
      } catch (loadError) {
        if (!cancelled) {
          setTrip(null)
          setTripError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el viaje activo.')
        }
      } finally {
        if (!cancelled) setTripLoading(false)
      }
    }

    void loadActiveTrip()

    return () => {
      cancelled = true
    }
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
        const errorMessage = payload && !payload.ok ? payload.error : null
        throw new Error(errorMessage ?? 'No se pudo actualizar el estatus.')
      }

      setTrip(payload.data)
    } catch (updateError) {
      setStatusError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el estatus.')
    }
  }


  if (driverLoading || tripLoading) return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--text-muted)' }}>Cargando viaje activo…</p>
    </div>
  )

  if (!driver) return null

  if (tripError) {
    return (
      <div style={{ padding: 20 }}>
        <div className="card" style={{ color: 'var(--danger)' }}>{tripError}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header con botón de logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bienvenido,</p>
          <p style={{ fontSize: 18, fontWeight: 700 }}>{driver?.name || 'Conductor'}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>🚪</span> Cerrar sesión
        </button>
      </div>

      {!trip ? (
        <div style={{ padding: 24, textAlign: 'center', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>✅</p>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Sin viaje activo</p>
          <p style={{ color: 'var(--text-muted)' }}>En cuanto te asignen un traslado aparecerá aquí.</p>
        </div>
      ) : (
        <>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
            borderRadius: 14, padding: '20px 18px', color: '#fff',
          }}>
            <p style={{ fontSize: 12, opacity: .8, marginBottom: 4 }}>Viaje activo</p>
            <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{trip.id}</p>
            <p style={{ fontSize: 14, opacity: .9 }}>{STATUS_LABELS[trip.status] ?? trip.status}</p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Ruta</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Origen</p>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{trip.origin_address}</p>
                {trip.origin_reference && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.origin_reference}</p>}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {trip.origin_contact_name} · {trip.origin_contact_phone}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', flexShrink: 0, marginTop: 4 }} />
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Destino</p>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{trip.destination_address}</p>
                {trip.destination_reference && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.destination_reference}</p>}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {trip.dest_contact_name} · {trip.dest_contact_phone}
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Vehículo</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🚗</span>
              <div>
                <p style={{ fontWeight: 700 }}>{trip.vehicle_brand} {trip.vehicle_model} {trip.vehicle_year}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{trip.vehicle_color} · {trip.vehicle_plates}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{trip.vehicle_condition}</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Actualizar estatus</p>
            {statusError && (
              <p style={{ color: 'var(--danger)', fontSize: 12 }}>{statusError}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { status: 'conductor_en_camino', label: '🚗 En camino al origen' },
                { status: 'recoleccion_proceso', label: '📋 Recolección en proceso' },
                { status: 'evidencia_inicial_pendiente', label: '📸 Subir evidencia inicial' },
                { status: 'traslado_curso', label: '🛣️ Iniciar traslado' },
                { status: 'entrega_proceso', label: '📦 Entrega en proceso' },
                { status: 'evidencia_final_pendiente', label: '📸 Subir evidencia final' },
                { status: 'finalizado', label: '✅ Marcar como finalizado' },
              ].map(({ status, label }) => (
                <button key={status}
                  onClick={() => updateStatus(status)}
                  style={{
                    padding: '11px 14px', borderRadius: 10,
                    background: trip.status === status ? 'var(--primary-dim)' : 'var(--surface-2)',
                    border: `1px solid ${trip.status === status ? 'var(--primary)' : 'var(--border)'}`,
                    color: 'var(--text)', cursor: 'pointer',
                    textAlign: 'left', fontSize: 14, fontWeight: 500,
                  }}>
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

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Pago estimado</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>
              ${Number(trip.driver_pay_mxn).toLocaleString('es-MX')}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              ~{trip.distance_km} km · Tarifa estándar
            </p>
          </div>
        </>
      )}
    </div>
  )
}
