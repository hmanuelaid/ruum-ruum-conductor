// ─── components/ui/Toast.tsx ──────────────────────────────────────────────────
'use client'

import { useToast } from '@/lib/store'

export default function Toast() {
  const { message } = useToast()
  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast${message ? ' visible' : ''}`}
    >
      {message}
    </div>
  )
}