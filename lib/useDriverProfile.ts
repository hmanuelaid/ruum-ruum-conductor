'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from './supabase'
import { useAuthStore, type Driver } from './store'

type DriverRow = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
}

export function useDriverProfile() {
  const router = useRouter()
  const { driver, setDriver, logout } = useAuthStore()
  const [verifiedDriver, setVerifiedDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDriverProfile() {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (cancelled) return

      if (userError || !user) {
        logout()
        setVerifiedDriver(null)
        setLoading(false)
        router.replace('/login')
        return
      }

      const { data, error: profileError } = await supabase
        .from('drivers')
        .select('id, name, phone, email')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (profileError || !data) {
        logout()
        setVerifiedDriver(null)
        setError('Perfil de conductor no encontrado.')
        setLoading(false)
        router.replace('/login')
        return
      }

      const row = data as DriverRow
      const nextDriver: Driver = {
        id: row.id,
        name: row.name ?? 'Conductor',
        phone: row.phone ?? '',
        email: row.email ?? user.email ?? '',
      }

      setDriver(nextDriver)
      setVerifiedDriver(nextDriver)
      setLoading(false)
    }

    void loadDriverProfile()

    return () => {
      cancelled = true
    }
  }, [logout, router, setDriver])

  return {
    driver: verifiedDriver,
    cachedDriver: driver,
    loading,
    error,
  }
}
