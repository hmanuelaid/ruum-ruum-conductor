'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SLIDES = [
  {
    emoji: '🚗',
    title: 'Bienvenido a Ruum Ruum',
    body: 'La plataforma que conecta conductores con pasajeros de forma rápida, segura y justa.',
  },
  {
    emoji: '💸',
    title: 'Gana a tu ritmo',
    body: 'Tú decides cuándo conectarte. Cobra por cada viaje y retira tus ganancias cuando quieras.',
  },
  {
    emoji: '📄',
    title: 'Todo en un lugar',
    body: 'Gestiona tus documentos, historial de viajes y soporte desde la app.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)

  function next() {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1)
    } else {
      router.push('/onboarding/registro')
    }
  }

  const slide = SLIDES[current]

  return (
    <div className="onboarding-shell">
      <button
        className="btn-skip"
        onClick={() => router.push('/onboarding/registro')}
      >
        Omitir
      </button>

      <div className="onboarding-card slide-card">
        <div className="slide-emoji">{slide.emoji}</div>
        <h1 className="onboarding-title">{slide.title}</h1>
        <p className="onboarding-sub">{slide.body}</p>

        <div className="dot-row">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === current ? 'dot-active' : ''}`}
            />
          ))}
        </div>

        <button className="btn-primary" onClick={next}>
          {current < SLIDES.length - 1 ? 'Siguiente' : 'Comenzar'}
        </button>
      </div>
    </div>
  )
}