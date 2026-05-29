'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trip } from './types'

interface Driver {
  id: string
  name: string
  phone: string
  email: string
  avatarUrl?: string
  docsExpiry?: string // ISO date del doc más próximo a vencer
}

interface AuthState {
  driver: Driver | null
  isAuthenticated: boolean
  firstLaunch: boolean
  onboardingComplete: boolean
  setDriver: (driver: Driver) => void
  logout: () => void
  completeOnboarding: () => void
}

interface AppState {
  available: boolean
  activeTrip: Trip | null
  settingsOpen: boolean
  toastMsg: string | null
  setAvailable: (v: boolean) => void
  setActiveTrip: (t: Trip | null) => void
  setSettingsOpen: (v: boolean) => void
  showToast: (msg: string) => void
  clearToast: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      driver: null,
      isAuthenticated: false,
      firstLaunch: true,
      onboardingComplete: false,
      setDriver: (driver) => set({ driver, isAuthenticated: true }),
      logout: () => set({ driver: null, isAuthenticated: false }),
      completeOnboarding: () => set({ firstLaunch: false, onboardingComplete: true }),
    }),
    { name: 'ruum-auth' }
  )
)

export const useAppStore = create<AppState>()((set) => ({
  available: false,
  activeTrip: null,
  settingsOpen: false,
  toastMsg: null,
  setAvailable: (v) => set({ available: v }),
  setActiveTrip: (t) => set({ activeTrip: t }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  showToast: (msg) => {
    set({ toastMsg: msg })
    setTimeout(() => set({ toastMsg: null }), 3000)
  },
  clearToast: () => set({ toastMsg: null }),
}))