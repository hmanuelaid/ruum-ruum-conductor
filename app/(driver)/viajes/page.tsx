'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  conductor_asignado: 'Asignado', conductor_en_camino: 'En camino',
  recoleccion_proceso: 'Recolección', evidencia_inicial_pendiente: 'Ev. inicial',
  traslado_curso: 'En curso', entrega_proceso: 'Entrega',
  evidencia_final_pendiente: 'Ev. final', finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  conductor_asignado: 'var(--primary)', traslado_curso: 'var(--accent)',
  finalizado: 'var(--success)', cancelado: 'var(--danger)',
}

interface DriverTrip {
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

type Tab = 'Activos' | 'Finalizados' | 'Todos'

const ACTIVE = ['conductor_asignado','conductor_en_camino','recoleccion_proceso',
  'evidencia_inicial_pendiente','traslado_curso','entrega_proceso','evidencia_final_pendiente']

export default function ViajesPage() {
  const { driver } = useAuthStore()
  const [tab, setTab] = useState<Tab>('Activos')
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!driver) return
    loadTrips()
  }, [driver, tab])

  async function loadTrips() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('trips')
      .select('id,status,vehicle_brand,vehicle_model,vehicle_plates,origin_address,destination_address,driver_pay_mxn,distance_km,created_at')
      .eq('driver_id', driver!.id)
      .order('created_at', { ascending: false })

    if (tab === 'Activos')    query = query.in('status', ACTIVE)
    if (tab === 'Finalizados') query = query.eq('status', 'finalizado')

    const { data } = await query
    setTrips((data ?? []) as DriverTrip[])
    setLoading(false)
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>Mis viajes</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 8, padding: 4 }}>
        {(['Activos','Finalizados','Todos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: 6, border: 'none',
              background: tab === t ? 'var(--surface)' : 'none',
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Cargando viajes…</p>
      ) : trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🚗</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin viajes aquí</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {tab === 'Activos' ? 'No tienes viajes activos en este momento.' : 'Aún no tienes viajes en esta categoría.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trips.map(t => (
            <div key={t.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 14,
              borderLeft: `3px solid ${STATUS_COLOR[t.status] ?? 'var(--border)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{t.id}</p>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 20, background: 'var(--surface-2)',
                  color: STATUS_COLOR[t.status] ?? 'var(--text-muted)',
                }}>
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {t.vehicle_brand} {t.vehicle_model} · {t.vehicle_plates}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {t.origin_address?.split(',')[0]} → {t.destination_address?.split(',')[0]}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>~{t.distance_km} km</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                  ${Number(t.driver_pay_mxn).toLocaleString('es-MX')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}