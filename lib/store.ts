'use client'

import { create } from 'zustand'
import type { Trip } from './types'

// ─── Toast ─────────────────────────────────────────────────────────────────────
interface ToastState {
  message: string | null
  show: (msg: string, ms?: number) => void
  hide: () => void
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (msg, ms = 3000) => {
    set({ message: msg })
    setTimeout(() => set({ message: null }), ms)
  },
  hide: () => set({ message: null }),
}))

// ─── Driver availability ───────────────────────────────────────────────────────
interface AvailabilityState {
  available: boolean
  toggle: () => void
}

export const useAvailability = create<AvailabilityState>((set) => ({
  available: true,
  toggle: () => set((s) => ({ available: !s.available })),
}))

// ─── Active trip ───────────────────────────────────────────────────────────────
type TripStep = 'en-route' | 'arrived' | 'evidence' | 'closed'

interface ActiveTripState {
  trip: Trip | null
  step: TripStep
  sheetOpen: boolean
  setTrip: (t: Trip | null) => void
  setStep: (s: TripStep) => void
  openSheet: () => void
  closeSheet: () => void
}

export const useActiveTrip = create<ActiveTripState>((set) => ({
  trip: null,
  step: 'en-route',
  sheetOpen: false,
  setTrip: (trip) => set({ trip }),
  setStep: (step) => set({ step }),
  openSheet: () => set({ sheetOpen: true }),
  closeSheet: () => set({ sheetOpen: false }),
}))

// ─── Settings sheet ────────────────────────────────────────────────────────────
interface SettingsState {
  open: boolean
  openSheet: () => void
  closeSheet: () => void
}

export const useSettings = create<SettingsState>((set) => ({
  open: false,
  openSheet: () => set({ open: true }),
  closeSheet: () => set({ open: false }),
}))