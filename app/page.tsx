'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, firstLaunch, onboardingComplete } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      if (firstLaunch && !onboardingComplete) {
        router.replace('/onboarding')
      } else {
        router.replace('/login')
      }
    } else {
      router.replace('/panel')
    }
  }, [isAuthenticated, firstLaunch, onboardingComplete, router])

  return null
}