import type { OperativeAlert } from '@/lib/types'

const ICON: Record<string, string> = { warning: '!', info: 'i', danger: '⚠' }

export default function AlertsList({ alerts }: { alerts: OperativeAlert[] }) {
  if (!alerts.length) return null

  return (
    <section>
      <div className="section-head">
        <h2>Alertas operativas</h2>
        <a href="/docs" className="btn-text">Resolver</a>
      </div>
      <div className="stack">
        {alerts.map(alert => (
          <article key={alert.id} className={`notice notice-${alert.severity}`}>
            <span aria-hidden="true">{ICON[alert.severity]}</span>
            <p>{alert.message}</p>
          </article>
        ))}
      </div>
    </section>
  )
}