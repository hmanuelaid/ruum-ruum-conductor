'use client'
import { useEffect, useState, useCallback } from 'react'
import { useDriverProfile } from '@/lib/useDriverProfile'
import TripFlowSheet from '@/components/trip/TripFlowSheet'
import type { TripDetail } from '@/lib/types'

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface OfferedTrip {
  id: string
  status: string
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_year: number | null
  vehicle_color: string | null
  vehicle_plates: string | null
  vehicle_transmission?: string | null
  origin_address: string | null
  origin_reference: string | null
  destination_address: string | null
  destination_reference: string | null
  driver_pay_mxn: number | null
  distance_km: number | null
  scheduled_at?: string | null
  service_type?: string | null
  special_instructions?: string | null
}

interface AssignedTrip {
  id: string
  status: string
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_plates: string | null
  origin_address: string | null
  destination_address: string | null
  driver_pay_mxn: number | null
  distance_km: number | null
  created_at: string
}

type Tab = 'Solicitados' | 'Aceptados' | 'Finalizados'

type OfferedApiResponse  = { ok: true; data: OfferedTrip[] } | { ok: false; error?: string }
type AssignedApiResponse = { ok: true; data: AssignedTrip[] } | { ok: false; error?: string }
type TripDetailResponse  = { ok: true; data: TripDetail }   | { ok: false; error?: string }

const ACTIVE_STATUSES = new Set([
  'conductor_asignado', 'conductor_en_camino', 'recoleccion_proceso',
  'evidencia_inicial_pendiente', 'traslado_curso',
  'entrega_proceso', 'evidencia_final_pendiente',
])

const STATUS_LABELS: Record<string, string> = {
  conductor_asignado:          'Asignado',
  conductor_en_camino:         'En camino',
  recoleccion_proceso:         'Recolección',
  evidencia_inicial_pendiente: 'Ev. inicial',
  traslado_curso:              'En curso',
  entrega_proceso:             'Entrega',
  evidencia_final_pendiente:   'Ev. final',
  finalizado:                  'Finalizado',
  cancelado:                   'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  conductor_asignado:          'var(--primary)',
  conductor_en_camino:         'var(--accent)',
  recoleccion_proceso:         'var(--warning)',
  evidencia_inicial_pendiente: 'var(--warning)',
  traslado_curso:              'var(--accent)',
  entrega_proceso:             'var(--warning)',
  evidencia_final_pendiente:   'var(--warning)',
  finalizado:                  'var(--success)',
  cancelado:                   'var(--danger)',
}

// ── Card: viaje ofertado ──────────────────────────────────────────────────────

function OfferedTripCard({
  trip, onAccept, onReject, actionLoading,
}: {
  trip: OfferedTrip
  onAccept: (id: string) => void
  onReject: (id: string) => void
  actionLoading: string | null
}) {
  const isLoading = actionLoading === trip.id
  const scheduled = trip.scheduled_at
    ? new Date(trip.scheduled_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
    : null

  return (
    <article style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
      borderLeft: '3px solid var(--primary)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
            background: 'rgba(108 99 255 / .15)', color: 'var(--primary)',
            textTransform: 'uppercase', letterSpacing: '.04em',
          }}>
            Ofertado
          </span>
          <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: 4 }}>
            {trip.id}
          </p>
        </div>
        {trip.service_type && (
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 20,
            background: 'var(--surface-2)', color: 'var(--text-muted)',
          }}>
            {trip.service_type}
          </span>
        )}
      </div>

      {/* Ruta */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 3, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
          <span style={{ width: 1, height: 22, background: 'var(--border)' }} />
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--success)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Origen</p>
            <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.origin_address ?? '—'}
            </p>
            {trip.origin_reference && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.origin_reference}</p>
            )}
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Destino</p>
            <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.destination_address ?? '—'}
            </p>
            {trip.destination_reference && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.destination_reference}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Vehículo</p>
          <p style={{ fontSize: 13, fontWeight: 600 }}>
            {[trip.vehicle_brand, trip.vehicle_model].filter(Boolean).join(' ') || '—'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {trip.vehicle_plates ?? ''}{trip.vehicle_transmission ? ` · ${trip.vehicle_transmission}` : ''}
          </p>
        </div>
        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Distancia</p>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{trip.distance_km ?? '—'} km</p>
          {scheduled && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{scheduled}</p>}
        </div>
      </div>

      {trip.special_instructions && (
        <div style={{
          background: 'rgba(245 158 11 / .08)', border: '1px solid rgba(245 158 11 / .2)',
          borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 12, color: 'var(--warning)' }}>{trip.special_instructions}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pago estimado</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>
            ${Number(trip.driver_pay_mxn ?? 0).toLocaleString('es-MX')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onReject(trip.id)}
            disabled={isLoading}
            style={{
              padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: '1px solid var(--danger)', background: 'transparent',
              color: 'var(--danger)', cursor: 'pointer', opacity: isLoading ? 0.5 : 1,
            }}
          >
            Rechazar
          </button>
          <button
            onClick={() => onAccept(trip.id)}
            disabled={isLoading}
            style={{
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: 'none', background: 'var(--success)',
              color: '#fff', cursor: 'pointer', opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? 'Procesando…' : 'Aceptar'}
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Card: viaje aceptado ──────────────────────────────────────────────────────

function AssignedTripCard({
  trip, onOpen, loadingId,
}: {
  trip: AssignedTrip
  onOpen: (id: string) => void
  loadingId: string | null
}) {
  const statusColor = STATUS_COLOR[trip.status] ?? 'var(--border)'
  const isLoading = loadingId === trip.id

  return (
    <button
      onClick={() => onOpen(trip.id)}
      disabled={isLoading}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 14,
        borderLeft: `3px solid ${statusColor}`,
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity .15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontWeight: 700, fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
          {trip.id}
        </p>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px',
          borderRadius: 20, background: 'var(--surface-2)', color: statusColor,
        }}>
          {isLoading ? '…' : (STATUS_LABELS[trip.status] ?? trip.status)}
        </span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
        {[trip.vehicle_brand, trip.vehicle_model].filter(Boolean).join(' ') || '—'}
        {trip.vehicle_plates ? ` · ${trip.vehicle_plates}` : ''}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {trip.origin_address?.split(',')[0] ?? '—'} → {trip.destination_address?.split(',')[0] ?? '—'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>~{trip.distance_km} km</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: 'var(--success)' }}>
            ${Number(trip.driver_pay_mxn ?? 0).toLocaleString('es-MX')}
          </span>
          <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
            {isLoading ? 'Cargando…' : 'Ver detalle →'}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ViajesPage() {
  const { driver, loading: driverLoading } = useDriverProfile()
  const [tab, setTab] = useState<Tab>('Solicitados')

  const [offered, setOffered]   = useState<OfferedTrip[]>([])
  const [assigned, setAssigned] = useState<AssignedTrip[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError]     = useState('')

  const [detailTrip, setDetailTrip]           = useState<TripDetail | null>(null)
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!driver) return
    setLoading(true)
    setError('')
    setActionError('')
    try {
      if (tab === 'Solicitados') {
        const res = await fetch('/api/trips/ofertados', { cache: 'no-store' })
        const payload = await res.json().catch(() => null) as OfferedApiResponse | null
        if (!res.ok || !payload?.ok) throw new Error(payload && !payload.ok ? payload.error : 'Error al cargar viajes.')
        setOffered(payload.data)
      } else {
        const res = await fetch('/api/trips', { cache: 'no-store' })
        const payload = await res.json().catch(() => null) as AssignedApiResponse | null
        if (!res.ok || !payload?.ok) throw new Error(payload && !payload.ok ? payload.error : 'Error al cargar viajes.')
        const filtered = payload.data.filter(t =>
          tab === 'Aceptados'
            ? ACTIVE_STATUSES.has(t.status)
            : t.status === 'finalizado' || t.status === 'cancelado'
        )
        setAssigned(filtered)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar viajes.')
    } finally {
      setLoading(false)
    }
  }, [driver, tab])

  useEffect(() => { void loadData() }, [loadData])

  async function handleAccept(tripId: string) {
    setActionLoading(tripId)
    setActionError('')
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/aceptar`, { method: 'POST' })
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.ok) throw new Error(payload?.error ?? 'No se pudo aceptar el viaje.')
      setOffered(prev => prev.filter(t => t.id !== tripId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo aceptar el viaje.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(tripId: string) {
    setActionLoading(tripId)
    setActionError('')
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/rechazar`, { method: 'POST' })
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.ok) throw new Error(payload?.error ?? 'No se pudo rechazar el viaje.')
      setOffered(prev => prev.filter(t => t.id !== tripId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo rechazar el viaje.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleOpenDetail(tripId: string) {
    setDetailLoadingId(tripId)
    setActionError('')
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, { cache: 'no-store' })
      const payload = await res.json().catch(() => null) as TripDetailResponse | null
      if (!res.ok || !payload?.ok) {
        const errMsg = payload && typeof payload === 'object' && 'error' in payload && (payload as any).error
          ? (payload as any).error
          : 'No se pudo cargar el detalle.'
        throw new Error(errMsg)
      }
      setDetailTrip(payload.data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo cargar el detalle.')
    } finally {
      setDetailLoadingId(null)
    }
  }

  function handleStatusChanged(updated: TripDetail) {
    setDetailTrip(updated)
    setAssigned(prev => prev.map(t =>
      t.id === updated.id ? { ...t, status: updated.status } : t
    ))
    // Si el viaje se finalizó, mover a la pestaña correcta en el próximo reload
  }

  const TABS: Tab[] = ['Solicitados', 'Aceptados', 'Finalizados']

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Mis viajes</h1>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--surface-2)', borderRadius: 10, padding: 4,
        }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 7, border: 'none',
              background: tab === t ? 'var(--surface)' : 'none',
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
              transition: 'background .15s',
            }}>
              {t}
              {t === 'Solicitados' && offered.length > 0 && tab !== 'Solicitados' && (
                <span style={{
                  marginLeft: 4, fontSize: 10, background: 'var(--primary)',
                  color: '#fff', borderRadius: 10, padding: '1px 5px',
                }}>
                  {offered.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {actionError && (
          <div style={{
            background: 'rgba(239 68 68 / .08)', border: '1px solid rgba(239 68 68 / .2)',
            borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: 13,
          }}>
            {actionError}
          </div>
        )}

        {driverLoading || loading ? (
          <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Cargando viajes…</p>
        ) : error ? (
          <div style={{
            background: 'rgba(239 68 68 / .08)', borderRadius: 10, padding: 16, color: 'var(--danger)',
          }}>{error}</div>
        ) : tab === 'Solicitados' ? (
          offered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '36px 16px',
              background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin viajes disponibles</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No hay traslados ofertados en este momento. Revisa más tarde.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {offered.map(t => (
                <OfferedTripCard
                  key={t.id} trip={t}
                  onAccept={handleAccept} onReject={handleReject}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )
        ) : (
          assigned.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '36px 16px',
              background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>🚗</p>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin viajes aquí</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {tab === 'Aceptados' ? 'No tienes viajes activos ahora.' : 'Aún no tienes viajes finalizados.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assigned.map(t => (
                <AssignedTripCard
                  key={t.id} trip={t}
                  onOpen={handleOpenDetail}
                  loadingId={detailLoadingId}
                />
              ))}
            </div>
          )
        )}
      </div>

      <TripFlowSheet
        trip={detailTrip}
        onClose={() => setDetailTrip(null)}
        onStatusChanged={handleStatusChanged}
      />
    </>
  )
}
