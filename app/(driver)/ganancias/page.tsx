'use client'
import { useEffect, useState } from 'react'
import type { EarningsSummary, WeekSummary, Movement } from '@/lib/types'

type Tab = 'resumen' | 'historial' | 'semanas'

type ApiResult =
  | { ok: true; data: EarningsSummary }
  | { ok: false; error?: string }

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function PayoutBadge({ status }: { status: WeekSummary['payoutStatus'] }) {
  const map: Record<WeekSummary['payoutStatus'], { label: string; bg: string; color: string }> = {
    pendiente:   { label: 'Pendiente',   bg: 'rgba(255,193,7,0.15)',  color: 'var(--warning)' },
    procesando:  { label: 'Procesando',  bg: 'rgba(59,130,246,0.15)', color: 'var(--accent)' },
    depositado:  { label: 'Depositado',  bg: 'rgba(34,197,94,0.15)',  color: 'var(--success)' },
  }
  const s = map[status]
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>{s.label}</span>
  )
}

function MovementIcon({ type }: { type: Movement['type'] }) {
  const icons: Record<Movement['type'], { icon: string; bg: string }> = {
    trip:       { icon: '🚐', bg: 'rgba(34,197,94,0.12)' },
    bonus:      { icon: '⭐', bg: 'rgba(245,158,11,0.12)' },
    deposit:    { icon: '🏦', bg: 'rgba(59,130,246,0.12)' },
    adjustment: { icon: '⚖️', bg: 'rgba(168,85,247,0.12)' },
    expense:    { icon: '📋', bg: 'rgba(239,68,68,0.12)' },
  }
  const s = icons[type]
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: s.bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 18, flexShrink: 0,
    }}>{s.icon}</div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GananciasPage() {
  const [data, setData] = useState<EarningsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('resumen')
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/earnings', { cache: 'no-store' })
        const payload = await res.json().catch(() => null) as ApiResult | null
        if (!res.ok || !payload?.ok) throw new Error(payload && !payload.ok ? payload.error : 'Error al cargar ganancias.')
        if (!cancelled) setData(payload.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar ganancias.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  if (loading) return (
    <div style={{ padding: 20, textAlign: 'center', paddingTop: 60 }}>
      <p style={{ fontSize: 28, marginBottom: 8 }}>💰</p>
      <p style={{ color: 'var(--text-muted)' }}>Cargando ganancias…</p>
    </div>
  )

  if (error) return (
    <div style={{ padding: 20 }}>
      <div style={{
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 12, padding: 16, color: 'var(--danger)',
      }}>{error}</div>
    </div>
  )

  if (!data) return null

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 100 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Ganancias</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Depósito los {data.payoutDay}s · {data.nextPayoutLabel}
        </p>
      </div>

      {/* Hero card — depósito disponible */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1a3a6e 100%)',
        borderRadius: 16, padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: 4,
        boxShadow: '0 8px 32px rgba(30,58,138,0.35)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500 }}>
          Próximo depósito estimado
        </p>
        <p style={{ color: '#fff', fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>
          ${fmt(data.weekNetMXN)}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            padding: '3px 10px', borderRadius: 20, fontSize: 12,
          }}>📅 {data.nextPayoutLabel}</span>
          <span style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            padding: '3px 10px', borderRadius: 20, fontSize: 12,
          }}>🚐 {data.weekTrips} viajes</span>
        </div>
      </div>

      {/* Desglose semana actual */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: 16,
      }}>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Desglose semana actual
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Ganancias generadas',  value: data.weekEarningsMXN,     color: 'var(--success)',  prefix: '+' },
            { label: 'Gastos autorizados',   value: -data.weekExpensesMXN,    color: 'var(--danger)',   prefix: data.weekExpensesMXN > 0 ? '-' : '' },
            { label: 'Ajustes / bonos',      value: data.weekAdjustmentsMXN,  color: 'var(--accent)',   prefix: data.weekAdjustmentsMXN >= 0 ? '+' : '' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: row.color }}>
                {row.prefix}${fmt(Math.abs(row.value))}
              </p>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontWeight: 800, fontSize: 14 }}>Depósito final estimado</p>
            <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--success)' }}>
              ${fmt(data.weekNetMXN)}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Total histórico',    value: `$${fmt(data.totalLifetimeMXN)}`, color: 'var(--success)',  icon: '💵' },
          { label: 'Km recorridos',      value: `${data.totalKm.toLocaleString('es-MX')} km`, color: 'var(--warning)', icon: '🛣️' },
          { label: 'Viajes esta semana', value: data.weekTrips.toString(),    color: 'var(--primary)',  icon: '📦' },
          { label: 'Ganado esta semana', value: `$${fmt(data.weekEarningsMXN)}`, color: 'var(--accent)',  icon: '📈' },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 14,
          }}>
            <p style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</p>
            <p style={{ fontSize: 19, fontWeight: 800, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 12,
        padding: 4, gap: 4,
      }}>
        {([
          { key: 'resumen',  label: 'Movimientos' },
          { key: 'semanas',  label: 'Por semana' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
              background: tab === t.key ? 'var(--primary)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-muted)',
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab: Movimientos */}
      {tab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.movements.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>💸</p>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin movimientos aún</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Los movimientos aparecerán conforme completes viajes.</p>
            </div>
          ) : data.movements.map(m => (
            <div key={m.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 14,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <MovementIcon type={m.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</p>
                {m.sublabel && (
                  <p style={{
                    fontSize: 12, color: 'var(--text-muted)', marginTop: 1,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{m.sublabel}</p>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.dateLabel}</p>
              </div>
              <p style={{
                fontWeight: 800, fontSize: 15,
                color: m.amountMXN < 0 ? 'var(--danger)' : 'var(--success)',
                whiteSpace: 'nowrap',
              }}>
                {m.amountMXN < 0 ? '-' : '+'}${fmt(Math.abs(m.amountMXN))}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Por semana */}
      {tab === 'semanas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.weekHistory.map((w, idx) => (
            <div
              key={w.weekStart}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
              }}
            >
              {/* Week row header */}
              <button
                onClick={() => setExpandedWeek(expandedWeek === w.weekStart ? null : w.weekStart)}
                style={{
                  width: '100%', padding: '14px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>
                      {idx === 0 ? '📅 Semana actual' : w.weekLabel}
                    </p>
                    <PayoutBadge status={w.payoutStatus} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {w.tripsCount} viaje{w.tripsCount !== 1 ? 's' : ''} · {w.payoutDateLabel}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--success)' }}>
                    ${fmt(w.netMXN)}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>neto</p>
                </div>
              </button>

              {/* Expandable detail */}
              {expandedWeek === w.weekStart && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '12px 16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {[
                    { label: 'Ganancias brutas',   val: w.grossMXN,       color: 'var(--success)', prefix: '+' },
                    { label: 'Gastos autorizados', val: -w.expensesMXN,   color: 'var(--danger)',  prefix: w.expensesMXN > 0 ? '-' : '' },
                    { label: 'Ajustes / bonos',    val: w.adjustmentsMXN, color: 'var(--accent)',  prefix: w.adjustmentsMXN >= 0 ? '+' : '' },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: row.color }}>
                        {row.prefix}${fmt(Math.abs(row.val))}
                      </p>
                    </div>
                  ))}
                  <div style={{
                    borderTop: '1px solid var(--border)', paddingTop: 8,
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>Depósito neto</p>
                    <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--success)' }}>
                      ${fmt(w.netMXN)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
