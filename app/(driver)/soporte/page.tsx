'use client'

import { useEffect, useMemo, useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { useAppStore } from '@/lib/store'
import { useDriverProfile } from '@/lib/useDriverProfile'

type SupportCategory = 'viaje' | 'pago' | 'documentos' | 'app' | 'emergencia' | 'otro'
type SupportPriority = 'normal' | 'alta' | 'urgente'

interface SupportTicket {
  id: string
  category: SupportCategory
  priority: SupportPriority
  subject: string
  message: string
  status: 'abierto' | 'en_revision' | 'resuelto' | 'cerrado'
  created_at: string
}

type SupportApiResponse =
  | { ok: true; data: SupportTicket[] }
  | { ok: false; error?: string }

type SupportCreateResponse =
  | { ok: true; data: SupportTicket }
  | { ok: false; error?: string }

const SUPPORT_PHONE = '+525512345678'
const WHATSAPP_PHONE = '525512345678'

const CATEGORY_OPTIONS: { value: SupportCategory; label: string; hint: string }[] = [
  { value: 'viaje', label: 'Viaje', hint: 'Ruta, entrega, contacto o evidencia' },
  { value: 'pago', label: 'Pago', hint: 'Cortes, depósitos o ajustes' },
  { value: 'documentos', label: 'Documentos', hint: 'Validación y expediente' },
  { value: 'app', label: 'App', hint: 'Errores técnicos' },
  { value: 'emergencia', label: 'Emergencia', hint: 'Atención prioritaria' },
  { value: 'otro', label: 'Otro', hint: 'Consulta general' },
]

const FAQS = [
  {
    title: 'No puedo cerrar un viaje',
    body: 'Revisa que el estado corresponda al paso actual y que la evidencia requerida ya esté cargada. Si el botón sigue bloqueado, crea una solicitud con el ID del viaje.',
  },
  {
    title: 'No veo mi próximo pago',
    body: 'Los pagos se calculan con viajes finalizados, gastos autorizados y ajustes del corte semanal. Si falta un viaje finalizado, repórtalo en la categoría Pago.',
  },
  {
    title: 'Mi documento aparece pendiente',
    body: 'Un documento pendiente necesita carga o recarga. Cuando está en revisión, el equipo operativo lo valida antes de aprobarlo.',
  },
]

function statusVariant(status: SupportTicket['status']): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'resuelto' || status === 'cerrado') return 'success'
  if (status === 'en_revision') return 'warning'
  return 'neutral'
}

function statusLabel(status: SupportTicket['status']) {
  const map: Record<SupportTicket['status'], string> = {
    abierto: 'Abierto',
    en_revision: 'En revisión',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
  }
  return map[status]
}

export default function SoportePage() {
  const { showToast } = useAppStore()
  const { driver, loading: driverLoading } = useDriverProfile()
  const [category, setCategory] = useState<SupportCategory>('viaje')
  const [priority, setPriority] = useState<SupportPriority>('normal')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const selectedCategory = useMemo(
    () => CATEGORY_OPTIONS.find(item => item.value === category),
    [category]
  )

  useEffect(() => {
    if (!driver) return
    let cancelled = false

    async function loadTickets() {
      setLoadingTickets(true)
      try {
        const res = await fetch('/api/support', { cache: 'no-store' })
        const payload = await res.json().catch(() => null) as SupportApiResponse | null
        if (!cancelled && res.ok && payload?.ok && Array.isArray(payload.data)) {
          setTickets(payload.data)
        }
      } finally {
        if (!cancelled) setLoadingTickets(false)
      }
    }

    void loadTickets()
    return () => { cancelled = true }
  }, [driver])

  function openWhatsApp() {
    const text = encodeURIComponent(`Hola, soy ${driver?.name ?? 'conductor'} y necesito soporte de Ruum Ruum.`)
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  async function submitTicket() {
    setError('')

    if (!subject.trim() || !message.trim()) {
      setError('Completa asunto y descripción para crear la solicitud.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, priority, subject, message }),
      })
      const payload = await res.json().catch(() => null) as SupportCreateResponse | null
      if (!res.ok || !payload?.ok) {
        throw new Error(payload && !payload.ok ? payload.error : 'No se pudo crear la solicitud.')
      }
      setTickets(prev => [payload.data, ...prev])
      setSubject('')
      setMessage('')
      setPriority('normal')
      showToast('Solicitud enviada a soporte')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la solicitud.')
    } finally {
      setSubmitting(false)
    }
  }

  if (driverLoading) {
    return <p className="muted">Cargando soporte...</p>
  }

  return (
    <>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2>¿Necesitas ayuda?</h2>
          <p className="muted">Contacta al equipo operativo o levanta una solicitud con seguimiento.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn-primary" onClick={openWhatsApp} style={{ padding: '12px 10px' }}>
            WhatsApp
          </button>
          <a className="btn-secondary" href={`tel:${SUPPORT_PHONE}`} style={{ textDecoration: 'none', padding: '12px 10px' }}>
            Llamar soporte
          </a>
        </div>

        <a
          className="notice notice-warning"
          href={`tel:${SUPPORT_PHONE}`}
          style={{ color: 'var(--text)', textDecoration: 'none' }}
        >
          <span>SOS</span>
          <p><strong>Asistencia en ruta 24/7.</strong> Usa esta opción si hay riesgo, incidente o bloqueo operativo.</p>
        </a>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p className="kicker">Nueva solicitud</p>
          <h2 style={{ fontSize: 17 }}>Levantar ticket</h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORY_OPTIONS.map(option => {
            const active = option.value === category
            return (
              <button
                key={option.value}
                onClick={() => setCategory(option.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 999,
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  background: active ? 'var(--primary-dim)' : 'var(--surface-2)',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {selectedCategory && <p className="muted">{selectedCategory.hint}</p>}

        <div className="segmented" style={{ background: 'var(--surface-2)' }}>
          {([
            { key: 'normal', label: 'Normal' },
            { key: 'alta', label: 'Alta' },
            { key: 'urgente', label: 'Urgente' },
          ] as { key: SupportPriority; label: string }[]).map(option => (
            <button
              key={option.key}
              className={priority === option.key ? 'active' : ''}
              onClick={() => setPriority(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <input
          className="field-input"
          placeholder="Asunto"
          value={subject}
          maxLength={120}
          onChange={e => setSubject(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        <textarea
          className="field-input"
          placeholder="Describe qué sucede"
          value={message}
          rows={4}
          maxLength={1200}
          onChange={e => setMessage(e.target.value)}
          style={{ resize: 'vertical', marginBottom: 0 }}
        />

        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

        <button className="btn-primary" disabled={submitting} onClick={submitTicket}>
          {submitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </section>

      <section className="stack">
        <div className="section-head" style={{ marginBottom: 0 }}>
          <h2>Solicitudes recientes</h2>
          {loadingTickets && <span className="muted">Cargando...</span>}
        </div>
        {tickets.length === 0 ? (
          <article className="list-card">
            <div>
              <small>Soporte</small>
              <strong>Sin solicitudes abiertas</strong>
              <p>Cuando levantes un ticket aparecerá aquí.</p>
            </div>
          </article>
        ) : tickets.map(ticket => (
          <article className="list-card" key={ticket.id}>
            <div>
              <small>{ticket.category} · {new Date(ticket.created_at).toLocaleDateString('es-MX')}</small>
              <strong>{ticket.subject}</strong>
              <p>{ticket.message}</p>
            </div>
            <Chip variant={statusVariant(ticket.status)}>{statusLabel(ticket.status)}</Chip>
          </article>
        ))}
      </section>

      <section className="stack">
        <div className="section-head" style={{ marginBottom: 0 }}>
          <h2>FAQs</h2>
        </div>
        {FAQS.map(faq => (
          <article className="list-card" key={faq.title} style={{ alignItems: 'flex-start' }}>
            <div>
              <small>Ayuda rápida</small>
              <strong>{faq.title}</strong>
              {expandedFaq === faq.title && <p>{faq.body}</p>}
            </div>
            <button
              className="btn-mini"
              aria-label="Abrir FAQ"
              onClick={() => setExpandedFaq(expandedFaq === faq.title ? null : faq.title)}
            >
              {expandedFaq === faq.title ? '−' : '+'}
            </button>
          </article>
        ))}
      </section>
    </>
  )
}
