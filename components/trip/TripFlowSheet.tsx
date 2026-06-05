'use client'
import { useEffect, useState, useRef } from 'react'
import type { TripDetail, TripFlowStatus } from '@/lib/types'
import { uploadTripEvidence } from '@/lib/storage'

// ─── Flujo de estados ─────────────────────────────────────────────────────────

interface FlowStep {
  status: TripFlowStatus
  label: string
  icon: string
  cta: string
  nextStatus: TripFlowStatus | null
  requiresEvidence?: 'pickup' | 'delivery'
  evidenceLabel?: string
}

const FLOW_STEPS: FlowStep[] = [
  {
    status: 'conductor_asignado',
    label: 'Viaje asignado',
    icon: '✓',
    cta: 'Ir al origen',
    nextStatus: 'conductor_en_camino',
  },
  {
    status: 'conductor_en_camino',
    label: 'En camino al origen',
    icon: '🚗',
    cta: 'Llegué al origen',
    nextStatus: 'recoleccion_proceso',
  },
  {
    status: 'recoleccion_proceso',
    label: 'Recogiendo vehículo',
    icon: '🔑',
    cta: 'Confirmar recolección',
    nextStatus: 'evidencia_inicial_pendiente',
  },
  {
    status: 'evidencia_inicial_pendiente',
    label: 'Evidencia de recolección',
    icon: '📷',
    cta: 'Iniciar traslado',
    nextStatus: 'traslado_curso',
    requiresEvidence: 'pickup',
    evidenceLabel: 'Foto del vehículo en origen',
  },
  {
    status: 'traslado_curso',
    label: 'Traslado en curso',
    icon: '🛣️',
    cta: 'Llegué al destino',
    nextStatus: 'entrega_proceso',
  },
  {
    status: 'entrega_proceso',
    label: 'Entregando vehículo',
    icon: '📍',
    cta: 'Confirmar entrega',
    nextStatus: 'evidencia_final_pendiente',
  },
  {
    status: 'evidencia_final_pendiente',
    label: 'Evidencia de entrega',
    icon: '📋',
    cta: 'Finalizar viaje',
    nextStatus: 'finalizado',
    requiresEvidence: 'delivery',
    evidenceLabel: 'Foto del vehículo en destino',
  },
]

const TERMINAL_STATUSES = new Set<TripFlowStatus>(['finalizado', 'cancelado'])

function getStepIndex(status: TripFlowStatus): number {
  return FLOW_STEPS.findIndex(s => s.status === status)
}

function hasEvidenceForStep(trip: TripDetail | null, step: FlowStep | null) {
  if (!trip || !step?.requiresEvidence) return false
  return step.requiresEvidence === 'pickup'
    ? !!trip.has_pickup_evidence
    : !!trip.has_delivery_evidence
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InfoRow({ label, value, href }: { label: string; value: string | null; href?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, minWidth: 90 }}>{label}</span>
      {href ? (
        <a href={href} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', textAlign: 'right' }}>{value}</a>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{value}</span>
      )}
    </div>
  )
}

function StepTimeline({ trip }: { trip: TripDetail }) {
  if (TERMINAL_STATUSES.has(trip.status)) return null
  const current = getStepIndex(trip.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--primary)', marginBottom: 10 }}>
        Progreso del viaje
      </p>
      <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {FLOW_STEPS.map((step, i) => {
          const done    = i < current
          const active  = i === current
          const pending = i > current
          return (
            <li key={step.status} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < FLOW_STEPS.length - 1 ? 0 : 0 }}>
              {/* Línea + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800,
                  background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--surface-2)',
                  border: `2px solid ${done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border)'}`,
                  color: done || active ? '#fff' : 'var(--text-muted)',
                  boxShadow: active ? '0 0 0 3px rgba(108 99 255 / .2)' : 'none',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 16,
                    background: done ? 'var(--success)' : 'var(--border)',
                  }} />
                )}
              </div>
              {/* Label */}
              <p style={{
                fontSize: 13, paddingTop: 2, paddingBottom: 14,
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--text)' : done ? 'var(--text-muted)' : pending ? 'var(--text-muted)' : 'var(--text)',
                opacity: pending ? 0.5 : 1,
              }}>
                {step.label}
                {active && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>← ahora</span>}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function EvidenceUploader({
  tripId,
  type,
  label,
  onUploaded,
}: {
  tripId: string
  type: 'pickup' | 'delivery'
  label: string
  onUploaded: () => void
}) {
  const [file, setFile]           = useState<File | null>(null)
  const [preview, setPreview]     = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
    setDone(false)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')
    const result = await uploadTripEvidence({ file, tripId, type })
    setUploading(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      setDone(true)
      onUploaded()
    }
  }

  if (done) {
    return (
      <div style={{
        background: 'rgba(34 197 94 / .08)', border: '1px solid rgba(34 197 94 / .2)',
        borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ fontSize: 18 }}>✓</span>
        <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Evidencia subida correctamente</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</p>

      {/* Preview o selector */}
      {preview ? (
        <div style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview} alt="preview"
            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
          />
          <button
            onClick={() => { setFile(null); setPreview(null) }}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '20px 16px', borderRadius: 10, border: '1.5px dashed var(--border)',
            background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: 13, textAlign: 'center', width: '100%',
          }}
        >
          📷 Toca para tomar o seleccionar foto
        </button>
      )}
      <input
        ref={inputRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {error && (
        <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>
      )}

      {file && !done && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            padding: '12px', borderRadius: 10, border: 'none',
            background: 'var(--primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? 'Subiendo…' : 'Confirmar evidencia'}
        </button>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface TripFlowSheetProps {
  trip: TripDetail | null
  onClose: () => void
  onStatusChanged: (updated: TripDetail) => void
}

export default function TripFlowSheet({ trip, onClose, onStatusChanged }: TripFlowSheetProps) {
  const isOpen = !!trip

  const [advancing, setAdvancing]       = useState(false)
  const [advanceError, setAdvanceError] = useState('')
  const [evidenceReady, setEvidenceReady] = useState(false)

  const currentStep = trip ? FLOW_STEPS.find(s => s.status === trip.status) ?? null : null
  const isTerminal  = trip ? TERMINAL_STATUSES.has(trip.status) : false

  useEffect(() => {
    setEvidenceReady(hasEvidenceForStep(trip, currentStep))
    setAdvanceError('')
  }, [trip, currentStep])

  async function handleAdvance() {
    if (!trip || !currentStep?.nextStatus) return

    // Si el paso actual tiene evidencia, verificar que ya se subió
    if (currentStep.requiresEvidence && !evidenceReady) {
      setAdvanceError('Debes subir la evidencia fotográfica primero.')
      return
    }

    setAdvancing(true)
    setAdvanceError('')
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(trip.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStep.nextStatus }),
      })
      const payload = await res.json().catch(() => null) as { ok: boolean; data?: TripDetail; error?: string } | null
      if (!res.ok || !payload?.ok || !payload.data) {
        throw new Error(payload?.error ?? 'No se pudo actualizar el estado.')
      }
      onStatusChanged(payload.data)
    } catch (err) {
      setAdvanceError(err instanceof Error ? err.message : 'Error al avanzar el viaje.')
    } finally {
      setAdvancing(false)
    }
  }

  const destEncoded = trip?.destination_address ? encodeURIComponent(trip.destination_address) : ''
  const originEncoded = trip?.origin_address ? encodeURIComponent(trip.origin_address) : ''

  return (
    <div
      className={`sheet-backdrop${isOpen ? ' open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      aria-hidden={!isOpen}
    >
      <aside className="sheet" role="dialog" aria-modal="true" style={{ gap: 0, paddingBottom: 40 }}>
        <div className="sheet-handle" />

        {trip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Header ── */}
            <div className="sheet-header" style={{ paddingTop: 4 }}>
              <div>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--primary)', marginBottom: 2 }}>
                  {isTerminal
                    ? (trip.status === 'finalizado' ? '✓ Viaje finalizado' : '✕ Viaje cancelado')
                    : currentStep?.label ?? 'Detalle del viaje'
                  }
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{trip.id}</p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--surface-2)', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', color: 'var(--text-muted)',
                  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
                aria-label="Cerrar"
              >✕</button>
            </div>

            {/* ── Pago ── */}
            <div style={{
              background: 'rgba(34 197 94 / .08)', border: '1px solid rgba(34 197 94 / .15)',
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Pago del viaje</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>
                  ${Number(trip.driver_pay_mxn ?? 0).toLocaleString('es-MX')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Distancia</p>
                <p style={{ fontSize: 18, fontWeight: 700 }}>{trip.distance_km ?? '—'} km</p>
              </div>
            </div>

            {/* ── Ruta ── */}
            <div style={{
              background: 'var(--surface-2)', borderRadius: 12, padding: 14,
              display: 'flex', gap: 12,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 3, flexShrink: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ width: 2, flex: 1, minHeight: 24, background: 'var(--border)' }} />
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', flexShrink: 0 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Origen</p>
                  <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trip.origin_address ?? '—'}
                  </p>
                  {trip.origin_reference && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.origin_reference}</p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Destino</p>
                  <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trip.destination_address ?? '—'}
                  </p>
                  {trip.destination_reference && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.destination_reference}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Navegación ── */}
            {!isTerminal && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${destEncoded}&origin=${originEncoded}`}
                  target="_blank" rel="noreferrer"
                  style={{
                    padding: '10px 8px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--surface-2)', color: 'var(--text)',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                  }}
                >🗺️ Google Maps</a>
                <a
                  href={`https://waze.com/ul?q=${destEncoded}&navigate=yes`}
                  target="_blank" rel="noreferrer"
                  style={{
                    padding: '10px 8px', borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--surface-2)', color: 'var(--text)',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                  }}
                >🚦 Waze</a>
              </div>
            )}

            {/* ── Vehículo ── */}
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--primary)', marginBottom: 10 }}>
                Vehículo
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow label="Marca / Modelo" value={[trip.vehicle_brand, trip.vehicle_model].filter(Boolean).join(' ') || null} />
                <InfoRow label="Año" value={trip.vehicle_year ? String(trip.vehicle_year) : null} />
                <InfoRow label="Color" value={trip.vehicle_color} />
                <InfoRow label="Placas" value={trip.vehicle_plates} />
                <InfoRow label="Condición" value={trip.vehicle_condition} />
              </div>
            </div>

            {/* ── Contactos ── */}
            {(trip.origin_contact_name || trip.origin_contact_phone || trip.dest_contact_name || trip.dest_contact_phone) && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--primary)', marginBottom: 10 }}>
                  Contactos
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {trip.origin_contact_name && (
                    <InfoRow label="Origen · nombre" value={trip.origin_contact_name} />
                  )}
                  {trip.origin_contact_phone && (
                    <InfoRow
                      label="Origen · teléfono"
                      value={trip.origin_contact_phone}
                      href={`tel:${trip.origin_contact_phone}`}
                    />
                  )}
                  {trip.dest_contact_name && (
                    <InfoRow label="Destino · nombre" value={trip.dest_contact_name} />
                  )}
                  {trip.dest_contact_phone && (
                    <InfoRow
                      label="Destino · teléfono"
                      value={trip.dest_contact_phone}
                      href={`tel:${trip.dest_contact_phone}`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── Timeline de progreso ── */}
            {!isTerminal && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
                <StepTimeline trip={trip} />
              </div>
            )}

            {/* ── Estado terminal ── */}
            {isTerminal && (
              <div style={{
                background: trip.status === 'finalizado'
                  ? 'rgba(34 197 94 / .08)' : 'rgba(239 68 68 / .08)',
                border: `1px solid ${trip.status === 'finalizado' ? 'rgba(34 197 94 / .2)' : 'rgba(239 68 68 / .2)'}`,
                borderRadius: 12, padding: '20px 16px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 32, marginBottom: 6 }}>
                  {trip.status === 'finalizado' ? '🏁' : '✕'}
                </p>
                <p style={{
                  fontSize: 16, fontWeight: 700,
                  color: trip.status === 'finalizado' ? 'var(--success)' : 'var(--danger)',
                }}>
                  {trip.status === 'finalizado' ? 'Viaje completado' : 'Viaje cancelado'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                  Pago de <strong style={{ color: 'var(--success)' }}>${Number(trip.driver_pay_mxn ?? 0).toLocaleString('es-MX')}</strong> será procesado en tu próximo corte.
                </p>
              </div>
            )}

            {/* ── Evidencia (si el paso actual la requiere) ── */}
            {!isTerminal && currentStep?.requiresEvidence && evidenceReady && (
              <div style={{
                background: 'rgba(34 197 94 / .08)', border: '1px solid rgba(34 197 94 / .2)',
                borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Evidencia lista para continuar</p>
              </div>
            )}

            {!isTerminal && currentStep?.requiresEvidence && !evidenceReady && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
                <EvidenceUploader
                  tripId={trip.id}
                  type={currentStep.requiresEvidence}
                  label={currentStep.evidenceLabel ?? 'Foto de evidencia'}
                  onUploaded={() => setEvidenceReady(true)}
                />
              </div>
            )}

            {/* ── Error de avance ── */}
            {advanceError && (
              <div style={{
                background: 'rgba(239 68 68 / .08)', border: '1px solid rgba(239 68 68 / .2)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--danger)', fontSize: 13,
              }}>
                {advanceError}
              </div>
            )}

            {/* ── CTA principal ── */}
            {!isTerminal && currentStep?.nextStatus && (
              <button
                onClick={handleAdvance}
                disabled={advancing || (!!currentStep.requiresEvidence && !evidenceReady)}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none',
                  background: (advancing || (!!currentStep.requiresEvidence && !evidenceReady))
                    ? 'var(--surface-2)' : 'var(--primary)',
                  color: (advancing || (!!currentStep.requiresEvidence && !evidenceReady))
                    ? 'var(--text-muted)' : '#fff',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {advancing ? 'Procesando…' : currentStep.cta}
              </button>
            )}

            {/* Cerrar si ya está terminal */}
            {isTerminal && (
              <button
                onClick={onClose}
                style={{
                  padding: '14px', borderRadius: 12, border: '1px solid var(--border)',
                  background: 'var(--surface-2)', color: 'var(--text)',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}





