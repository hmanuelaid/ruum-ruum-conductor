'use client'

import { useEffect, useState } from 'react'
import type { EarningsSummary } from '@/lib/types'

type EarningsApiResponse =
  | { ok: true; data: EarningsSummary }
  | { ok: false; error?: string }

export function usePanelSummary(driverId: string | undefined) {
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!driverId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/earnings', { cache: 'no-store' })
        const payload = await res.json().catch(() => null) as EarningsApiResponse | null
        if (!cancelled && payload?.ok) setSummary(payload.data)
      } catch {
        // non-critical, panel still works without summary
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [driverId])

  return { summary, loading }
}
