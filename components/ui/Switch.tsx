// ─── components/ui/Switch.tsx ─────────────────────────────────────────────────
'use client'

interface SwitchProps {
  checked: boolean
  onToggle: () => void
  label?: string
}

export function Switch({ checked, onToggle, label }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={`switch-track${checked ? ' on' : ''}`}
    >
      <span className="switch-thumb" />
    </button>
  )
}

