'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    // Guardar número en sessionStorage para el paso OTP
    sessionStorage.setItem('reg_phone', form.phone)
    sessionStorage.setItem('reg_data', JSON.stringify(form))
    router.push('/onboarding/verificacion')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>
      <div className="onboarding-card">
        <div className="step-badge">Paso 1 de 3</div>
        <h1 className="onboarding-title">Crea tu cuenta</h1>
        <p className="onboarding-sub">Tus datos básicos para empezar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-label">Nombre completo</label>
          <input className="field-input" placeholder="Juan García" value={form.name}
            onChange={e => set('name', e.target.value)} required />

          <label className="field-label">Teléfono</label>
          <input className="field-input" type="tel" placeholder="+52 55 0000 0000"
            value={form.phone} onChange={e => set('phone', e.target.value)} required />

          <label className="field-label">Correo electrónico</label>
          <input className="field-input" type="email" placeholder="correo@ejemplo.com"
            value={form.email} onChange={e => set('email', e.target.value)} required />

          <label className="field-label">Contraseña</label>
          <input className="field-input" type="password" placeholder="Mínimo 8 caracteres"
            value={form.password} onChange={e => set('password', e.target.value)}
            minLength={8} required />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Continuando…' : 'Continuar'}
          </button>
        </form>

        <button className="btn-ghost" onClick={() => router.push('/login')}>
          Ya tengo cuenta
        </button>
      </div>
    </div>
  )
}