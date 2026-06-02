'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, '')
}

function isE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone)
}

type DriverProfileResponse =
  | { ok: true; data: { id: string; name: string; phone?: string | null; email: string } }
  | { ok: false; error?: string }

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()
  const { setDriver } = useAuthStore()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const phone = normalizePhone(form.phone)
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()

    if (!name) {
      setError('Ingresa tu nombre completo.')
      return
    }

    if (!isE164(phone)) {
      setError('Ingresa el teléfono en formato internacional, por ejemplo +525500000000.')
      return
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          name,
          phone,
          user_type: 'driver',
        },
      },
    })

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'No pudimos crear tu cuenta.')
      setLoading(false)
      return
    }

    if (!signUpData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      })

      if (signInError || !signInData.user) {
        setError('Cuenta creada. Confirma tu correo e inicia sesión para continuar.')
        setLoading(false)
        return
      }
    }

    const profileResponse = await fetch('/api/drivers/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    })

    const profilePayload = (await profileResponse.json().catch(() => null)) as
      | DriverProfileResponse
      | null

    if (!profileResponse.ok || !profilePayload?.ok) {
      const message =
        profilePayload && !profilePayload.ok
          ? profilePayload.error
          : 'No pudimos crear tu perfil de conductor. Intenta de nuevo.'

      setError(message ?? 'No pudimos crear tu perfil de conductor. Intenta de nuevo.')
      setLoading(false)
      return
    }

    setDriver({
      id: profilePayload.data.id,
      name: profilePayload.data.name,
      phone: profilePayload.data.phone ?? '',
      email: profilePayload.data.email,
    })

    setLoading(false)
    router.push('/onboarding/documentos')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>
        ← Atrás
      </button>

      <div className="onboarding-card">
        <div className="step-badge">Paso 1 de 2</div>
        <h1 className="onboarding-title">Crea tu cuenta</h1>
        <p className="onboarding-sub">Tus datos básicos para empezar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-label">Nombre completo</label>
          <input
            className="field-input"
            placeholder="Juan García"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />

          <label className="field-label">Teléfono</label>
          <input
            className="field-input"
            type="tel"
            placeholder="+525500000000"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            required
          />

          <label className="field-label">Correo electrónico</label>
          <input
            className="field-input"
            type="email"
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />

          <label className="field-label">Contraseña</label>
          <input
            className="field-input"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            minLength={8}
            required
          />

          <label className="field-label">Confirmar contraseña</label>
          <input
            className="field-input"
            type="password"
            placeholder="Repite tu contraseña"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            minLength={8}
            required
          />

          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <button className="btn-ghost" onClick={() => router.push('/login')}>
          Ya tengo cuenta
        </button>
      </div>
    </div>
  )
}
