'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useAppStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const { setDriver } = useAuthStore()
  const { showToast } = useAppStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !password) return
    setLoading(true)
    // TODO: conectar con backend real
    await new Promise(r => setTimeout(r, 800))
    setDriver({
      id: 'drv_001',
      name: 'Manuel Hernández',
      phone,
      email: 'manuel@example.com',
      docsExpiry: '2025-12-31',
    })
    showToast('Bienvenido de vuelta')
    router.replace('/panel')
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="brand-mark">R</div>
        <h1 className="onboarding-title">Iniciar sesión</h1>
        <p className="onboarding-sub">Accede a tu cuenta de conductor</p>

        <form onSubmit={handleLogin} className="auth-form">
          <label className="field-label">Teléfono</label>
          <input
            type="tel"
            className="field-input"
            placeholder="+52 55 0000 0000"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />

          <label className="field-label">Contraseña</label>
          <input
            type="password"
            className="field-input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <button
          className="btn-ghost"
          onClick={() => router.push('/onboarding')}
        >
          ¿Conductor nuevo? Regístrate
        </button>
      </div>
    </div>
  )
}