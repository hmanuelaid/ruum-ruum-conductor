import type { EarningsSummary } from '@/lib/types'

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function daysUntil(dateISO: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(`${dateISO}T00:00:00`)
  const diff = Math.ceil((date.getTime() - today.getTime()) / 86_400_000)
  return Math.max(diff, 0)
}

export default function NextPayoutCard({ earnings }: { earnings: EarningsSummary }) {
  const days = daysUntil(earnings.nextPayoutDateISO)
  const gross = earnings.weekEarningsMXN
  const expenses = earnings.weekExpensesMXN
  const adjustments = earnings.weekAdjustmentsMXN

  return (
    <section className="card" aria-label="Próximo pago" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Próximo pago</p>
          <p style={{ fontSize: 30, fontWeight: 900, color: 'var(--success)', lineHeight: 1.1 }}>
            ${fmt(earnings.weekNetMXN)}
          </p>
        </div>
        <span className="chip chip-info">{days === 0 ? 'Hoy' : `${days} día${days === 1 ? '' : 's'}`}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700 }}>{earnings.nextPayoutLabel}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {earnings.weekTrips} viaje{earnings.weekTrips === 1 ? '' : 's'} en corte actual
          </p>
        </div>
        <a href="/ganancias" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Ver detalle
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Bruto', value: gross, color: 'var(--success)', prefix: '+' },
          { label: 'Gastos', value: expenses, color: 'var(--danger)', prefix: '-' },
          { label: 'Ajustes', value: adjustments, color: 'var(--accent)', prefix: adjustments >= 0 ? '+' : '-' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 10, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: item.color, whiteSpace: 'nowrap' }}>
              {item.prefix}${fmt(Math.abs(item.value))}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
