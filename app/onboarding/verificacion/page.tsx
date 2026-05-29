'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerificacionPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const phone =
    typeof window !== 'undefined' ? sessionStorage.getItem('reg_phone') ?? '' : ''

  function handleInput(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  async function verify() {
    const full = code.join('')
    if (full.length < 6) { setError('Ingresa los 6 dígitos'); return }
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 700))
    // TODO: verificar con backend; por ahora cualquier código pasa
    router.push('/onboarding/documentos')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>
      <div className="onboarding-card">
        <div className="step-badge">Paso 2 de 3</div>
        <h1 className="onboarding-title">Verifica tu número</h1>
        <p className="onboarding-sub">
          Enviamos un código SMS a <strong>{phone || 'tu teléfono'}</strong>
        </p>

        <div className="otp-row">
          {code.map((d, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el }}
              className="otp-box"
              maxLength={1}
              value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              inputMode="numeric"
            />
          ))}
        </div>

        {error && <p className="field-error">{error}</p>}

        <button className="btn-primary" onClick={verify} disabled={loading}>
          {loading ? 'Verificando…' : 'Verificar'}
        </button>

        <button className="btn-ghost">Reenviar código</button>
      </div>
    </div>
  )
}