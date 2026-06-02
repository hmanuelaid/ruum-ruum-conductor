'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '')
}

function isE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone)
}

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const phone = normalizePhone(form.phone)

    if (!isE164(phone)) {
      setError('Ingresa el teléfono en formato internacional, por ejemplo +525500000000.')
      return
    }

    setLoading(true)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
    })

    setLoading(false)

    if (otpError) {
      setError(`No pudimos enviar el código: ${otpError.message}`)
      return
    }

    sessionStorage.setItem(
      'driver_onboarding_draft',
      JSON.stringify({
        name: form.name.trim(),
        phone,
        email: form.email.trim().toLowerCase(),
      }),
    )

    router.push('/onboarding/verificacion')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>
        ← Atrás
      </button>

      <div className="onboarding-card">
        <div className="step-badge">Paso 1 de 3</div>
        <h1 className="onboarding-title">Crea tu cuenta</h1>
        <p className="onboarding-sub">Tus datos básicos para empezar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-label">Nombre completo</label>
          <input
            className="field-input"
            placeholder="Juan García"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />

          <label className="field-label">Teléfono</label>
          <input
            className="field-input"
            type="tel"
            placeholder="+525500000000"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            required
          />

          <label className="field-label">Correo electrónico</label>
          <input
            className="field-input"
            type="email"
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enviando código…' : 'Enviar código'}
          </button>
        </form>

        <button className="btn-ghost" onClick={() => router.push('/login')}>
          Ya tengo cuenta
        </button>
      </div>
    </div>
  )
}