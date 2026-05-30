'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const { setDriver } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()

    const email = `${phone.replace(/\D/g, '')}@conductor.ruumruum.app`
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('Teléfono o contraseña incorrectos'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('drivers')
      .select('*')
      .eq('auth_id', data.user.id)
      .single()

    if (!profile) { setError('Perfil de conductor no encontrado'); setLoading(false); return }

     setDriver({
  id: profile.id,
  name: profile.name,
  phone: profile.phone ?? '',
  email: profile.email,
})
    router.replace('/inicio')
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="brand-mark">R</div>
        <h1 className="onboarding-title">Iniciar sesión</h1>
        <p className="onboarding-sub">Accede a tu panel de conductor</p>
        <form onSubmit={handleLogin} className="auth-form">
          <label className="field-label">Teléfono</label>
          <input type="tel" className="field-input" placeholder="+52 55 0000 0000"
            value={phone} onChange={e => setPhone(e.target.value)} required />
          <label className="field-label">Contraseña</label>
          <input type="password" className="field-input" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <button className="btn-ghost" onClick={() => router.push('/onboarding')}>
          ¿Nuevo conductor? Regístrate
        </button>
      </div>
    </div>
  )
}