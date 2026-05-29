// ─── components/driver/WeeklyMetrics.tsx ──────────────────────────────────────
import type { EarningsSummary } from '@/lib/types'

export default function WeeklyMetrics({ earnings }: { earnings: EarningsSummary }) {
  const { weekTrips, weekEarningsMXN, nextPayoutLabel } = earnings
  const pendingDocs = 1 // TODO: derive from mockDocuments

  const metrics = [
    { label: 'Viajes semana',   value: String(weekTrips),                     sub: '+3 vs semana anterior' },
    { label: 'Ganancia semana', value: `$${weekEarningsMXN.toLocaleString('es-MX')}`, sub: 'Pago estimado viernes' },
    { label: 'Próximo pago',    value: nextPayoutLabel.split('·')[0].trim(),   sub: nextPayoutLabel.split('·')[1]?.trim() ?? '' },
    { label: 'Documentos',      value: `${5 - pendingDocs}/5`,                sub: `${pendingDocs} pendiente` },
  ]

  return (
    <section className="metric-grid" aria-label="Resumen semanal">
      {metrics.map(m => (
        <article key={m.label} className="metric-card">
          <small>{m.label}</small>
          <strong>{m.value}</strong>
          <span>{m.sub}</span>
        </article>
      ))}
    </section>
  )
}
