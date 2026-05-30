'use client'
import { useEffect, useState } from 'react'
import { useAppStore, useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  conductor_asignado: 'Conductor asignado', conductor_en_camino: 'En camino al origen',
  recoleccion_proceso: 'Recolección en proceso', evidencia_inicial_pendiente: 'Evidencia inicial pendiente',
  traslado_curso: 'Traslado en curso', entrega_proceso: 'Entrega en proceso',
  evidencia_final_pendiente: 'Evidencia final pendiente', finalizado: 'Finalizado',
}

type EvidenceType = 'inicial' | 'final'

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

const NEXT_STATUS_BY_EVIDENCE: Record<EvidenceType, string> = {
  inicial: 'traslado_curso',
  final: 'finalizado',
}

export default function PanelPage() {
  const { driver } = useAuthStore()
  const { showToast } = useAppStore()
  const [trip, setTrip] = useState<ActiveTrip | null>(null)
  const [loading, setLoading] = useState(true)
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [kmReading, setKmReading] = useState('')
  const [fuelLevel, setFuelLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [uploadingEvidence, setUploadingEvidence] = useState(false)

  useEffect(() => {
    if (!driver) return
    const driverId = driver.id
    let cancelled = false

    async function loadActiveTrip() {
      const supabase = createClient()
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driverId)
        .not('status', 'in', '("finalizado","cancelado")')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (cancelled) return
      setTrip(data)
      setLoading(false)
    }

    void loadActiveTrip()
    return () => { cancelled = true }
  }, [driver])

  function resetEvidenceForm() {
    setEvidenceFiles([])
    setKmReading('')
    setFuelLevel('')
    setNotes('')
  }

  async function uploadEvidence(type: EvidenceType) {
    if (!trip || !driver) return
    if (evidenceFiles.length === 0) {
      showToast('Agrega al menos una foto')
      return
    }

    setUploadingEvidence(true)
    const supabase = createClient()
    const uploadedUrls: string[] = []

    for (const [index, file] of evidenceFiles.entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `${trip.id}/${type}/${Date.now()}-${index}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        showToast('Error al subir una foto')
        setUploadingEvidence(false)
        return
      }

      const { data } = supabase.storage.from('evidence').getPublicUrl(path)
      uploadedUrls.push(data.publicUrl)
    }

    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .insert({
        trip_id: trip.id,
        type,
        status: 'en_revision',
        km_reading: kmReading ? Number(kmReading) : null,
        fuel_level: fuelLevel ? Number(fuelLevel) : null,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (evidenceError || !evidence) {
      showToast('Error al guardar la evidencia')
      setUploadingEvidence(false)
      return
    }

    const { error: photosError } = await supabase.from('evidence_photos').insert(
      uploadedUrls.map(url => ({
        evidence_id: evidence.id,
        url,
      }))
    )

    if (photosError) {
      showToast('Error al guardar las fotos')
      setUploadingEvidence(false)
      return
    }

    const nextStatus = NEXT_STATUS_BY_EVIDENCE[type]
    await supabase.from('trips').update({ status: nextStatus }).eq('id', trip.id)
    setTrip({ ...trip, status: nextStatus })
    resetEvidenceForm()
    showToast(type === 'inicial' ? 'Evidencia inicial cargada' : 'Evidencia final cargada')
    setUploadingEvidence(false)
  }

  async function updateStatus(newStatus: string) {
    if (!trip) return
    const supabase = createClient()
    await supabase.from('trips').update({ status: newStatus }).eq('id', trip.id)
    setTrip({ ...trip, status: newStatus })
    resetEvidenceForm()
  }

  if (loading) return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--text-muted)' }}>Cargando viaje activo…</p>
    </div>
  )

  if (!trip) return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>✅</p>
      <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Sin viaje activo</p>
      <p style={{ color: 'var(--text-muted)' }}>En cuanto te asignen un traslado aparecerá aquí.</p>
    </div>
  )

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header del viaje */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
        borderRadius: 14, padding: '20px 18px', color: '#fff',
      }}>
        <p style={{ fontSize: 12, opacity: .8, marginBottom: 4 }}>Viaje activo</p>
        <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{trip.id}</p>
        <p style={{ fontSize: 14, opacity: .9 }}>{STATUS_LABELS[trip.status] ?? trip.status}</p>
      </div>

      {/* Ruta */}
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

      {/* Vehículo */}
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

      {(trip.status === 'evidencia_inicial_pendiente' || trip.status === 'evidencia_final_pendiente') && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>
              {trip.status === 'evidencia_inicial_pendiente' ? 'Evidencia inicial' : 'Evidencia final'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Sube fotos claras del vehículo y registra kilometraje, combustible y notas relevantes.
            </p>
          </div>

          <label style={{
            border: '1px dashed var(--border)',
            background: 'var(--surface-2)',
            borderRadius: 12,
            padding: 16,
            display: 'grid',
            placeItems: 'center',
            gap: 6,
            cursor: 'pointer',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 24 }}>📸</span>
            <strong style={{ fontSize: 13 }}>Seleccionar fotos</strong>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {evidenceFiles.length > 0 ? `${evidenceFiles.length} foto(s) seleccionada(s)` : 'JPG, PNG o HEIC desde tu dispositivo'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={event => setEvidenceFiles(Array.from(event.target.files ?? []))}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Kilometraje</span>
              <input
                inputMode="numeric"
                value={kmReading}
                onChange={event => setKmReading(event.target.value)}
                placeholder="Ej. 45210"
                style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Combustible %</span>
              <input
                inputMode="numeric"
                value={fuelLevel}
                onChange={event => setFuelLevel(event.target.value)}
                placeholder="Ej. 80"
                style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Notas</span>
            <textarea
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Observaciones del estado del vehículo"
              rows={3}
              style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', resize: 'vertical' }}
            />
          </label>

          <button
            onClick={() => uploadEvidence(trip.status === 'evidencia_inicial_pendiente' ? 'inicial' : 'final')}
            disabled={uploadingEvidence}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: 0,
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 700,
              cursor: uploadingEvidence ? 'not-allowed' : 'pointer',
              opacity: uploadingEvidence ? .7 : 1,
            }}>
            {uploadingEvidence ? 'Guardando evidencia…' : 'Guardar evidencia'}
          </button>
        </div>
      )}

      {/* Acciones de estatus */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontWeight: 700, fontSize: 14 }}>Actualizar estatus</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { status: 'conductor_en_camino',           label: '🚗 En camino al origen' },
            { status: 'recoleccion_proceso',            label: '📋 Recolección en proceso' },
            { status: 'evidencia_inicial_pendiente',    label: '📸 Cargar evidencia inicial' },
            { status: 'traslado_curso',                 label: '🛣️ Iniciar traslado' },
            { status: 'entrega_proceso',                label: '📦 Entrega en proceso' },
            { status: 'evidencia_final_pendiente',      label: '📸 Cargar evidencia final' },
            { status: 'finalizado',                     label: '✅ Marcar como finalizado' },
          ].map(({ status, label }) => (
            <button key={status}
              onClick={() => updateStatus(status)}
              style={{
                padding: '11px 14px',
                borderRadius: 10,
                background: trip.status === status ? 'var(--primary-dim)' : 'var(--surface-2)',
                border: `1px solid ${trip.status === status ? 'var(--primary)' : 'var(--border)'}`,
                color: 'var(--text)', cursor: 'pointer',
                textAlign: 'left', fontSize: 14, fontWeight: 500,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pago estimado */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Pago estimado</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>
          ${Number(trip.driver_pay_mxn).toLocaleString('es-MX')}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          ~{trip.distance_km} km · Tarifa estándar
        </p>
      </div>
    </div>
  )
}
