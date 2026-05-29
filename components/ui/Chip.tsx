
// ─── components/ui/Chip.tsx ───────────────────────────────────────────────────
import type { TripStatus, DocumentStatus, AlertSeverity } from '@/lib/types'

type ChipVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const variantMap: Record<string, ChipVariant> = {
  active:    'warning',
  completed: 'success',
  closed:    'neutral',
  cancelled: 'danger',
  approved:  'success',
  review:    'warning',
  pending:   'neutral',
  warning:   'warning',
  info:      'info',
  danger:    'danger',
}

interface ChipProps {
  variant?: ChipVariant
  status?: TripStatus | DocumentStatus | AlertSeverity | string
  children: React.ReactNode
}

export function Chip({ variant, status, children }: ChipProps) {
  const v = variant ?? (status ? variantMap[status] ?? 'neutral' : 'neutral')
  return <span className={`chip chip-${v}`}>{children}</span>
}

