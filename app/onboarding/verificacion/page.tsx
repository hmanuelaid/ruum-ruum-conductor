'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type DriverOnboardingDraft = {
  name: string
  phone: string
  email: string
}

function readDraft(): DriverOnboardingDraft | null {
  try {
    const raw = sessionStorage.getItem('driver_onboarding_draft')
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DriverOnboardingDraft>

    if (!parsed.name || !parsed.phone || !parsed.email) return null

    return {
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email,
    }
  } catch {
    return null
  }
}

export default function VerificacionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [draft, setDraft] = useState<DriverOnboardingDraft | null>(null)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const savedDraft = readDraft()

    if (!savedDraft) {
      router.replace('/onboarding/registro')
      return
    }

    setDraft(savedDraft)
  }, [router])

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
    if (!draft) return

    const token = code.join('')

    if (token.length !== 6) {
      setError('Ingresa los 6 dígitos.')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: draft.phone,
      token,
      type: 'sms',
    })

    if (verifyError || !data.user) {
      setLoading(false)
      setError('Código inválido o expirado.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email: draft.email,
      password,
    })

    if (updateError) {
      setLoading(false)
      setError(updateError.message)
      return
    }

    const profileResponse = await fetch('/api/drivers/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        onboarding_status: 'documents_pending',
      }),
    })

    if (!profileResponse.ok) {
      await supabase.auth.signOut()
      setLoading(false)
      setError('No pudimos crear tu perfil de conductor. Intenta de nuevo.')
      return
    }

    sessionStorage.removeItem('driver_onboarding_draft')
    setLoading(false)

    router.push('/onboarding/documentos')
  }

  async function resendCode() {
    if (!draft) return

    setResending(true)
    setError('')

    const { error: resendError } = await supabase.auth.signInWithOtp({
      phone: draft.phone,
    })

    setResending(false)

    if (resendError) {
      setError(`No pudimos reenviar el código: ${resendError.message}`)
      return
    }

    setCode(['', '', '', '', '', ''])
    inputs.current[0]?.focus()
  }

  if (!draft) {
    return (
      <div className="onboarding-shell">
        <div className="onboarding-card">
          <p className="onboarding-sub">Cargando verificación…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>
        ← Atrás
      </button>

      <div className="onboarding-card">
        <div className="step-badge">Paso 2 de 3</div>
        <h1 className="onboarding-title">Verifica tu número</h1>
        <p className="onboarding-sub">
          Enviamos un código SMS a <strong>{draft.phone}</strong>
        </p>

        <div className="otp-row">
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el
              }}
              className="otp-box"
              maxLength={1}
              value={d}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              aria-label={`Dígito ${i + 1} del código`}
            />
          ))}
        </div>

        <label className="field-label">Contraseña</label>
        <input
          className="field-input"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <label className="field-label">Confirmar contraseña</label>
        <input
          className="field-input"
          type="password"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />

        {error && <p className="field-error">{error}</p>}

        <button className="btn-primary" onClick={verify} disabled={loading}>
          {loading ? 'Verificando…' : 'Verificar'}
        </button>

        <button className="btn-ghost" onClick={resendCode} disabled={resending}>
          {resending ? 'Reenviando…' : 'Reenviar código'}
        </button>
      </div>
    </div>
  )
}