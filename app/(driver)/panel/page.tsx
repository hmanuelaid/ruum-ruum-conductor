'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  conductor_asignado: 'Conductor asignado', conductor_en_camino: 'En camino al origen',
  recoleccion_proceso: 'Recolección en proceso', evidencia_inicial_pendiente: 'Evidencia inicial pendiente',
  traslado_curso: 'Traslado en curso', entrega_proceso: 'Entrega en proceso',
  evidencia_final_pendiente: 'Evidencia final pendiente', finalizado: 'Finalizado',
}

export default function PanelPage() {
  const router = useRouter()
  const { driver, clearAuth } = useAuthStore()
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!driver) return
    loadActiveTrip()
  }, [driver])

  async function loadActiveTrip() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driver!.id)
      .not('status', 'in', '("finalizado","cancelado")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setTrip(data)
    setLoading(false)
  }

  async function updateStatus(newStatus: string) {
    if (!trip) return
    const supabase = createClient()
    await supabase.from('trips').update({ status: newStatus }).eq('id', trip.id)
    setTrip({ ...trip, status: newStatus })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--text-muted)' }}>Cargando viaje activo…</p>
    </div>
  )

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { status: 'conductor_en_camino',        label: '🚗 En camino al origen' },
                { status: 'recoleccion_proceso',         label: '📋 Recolección en proceso' },
                { status: 'evidencia_inicial_pendiente', label: '📸 Cargar evidencia inicial' },
                { status: 'traslado_curso',              label: '🛣️ Iniciar traslado' },
                { status: 'entrega_proceso',             label: '📦 Entrega en proceso' },
                { status: 'evidencia_final_pendiente',   label: '📸 Cargar evidencia final' },
                { status: 'finalizado',                  label: '✅ Marcar como finalizado' },
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