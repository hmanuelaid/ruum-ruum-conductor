'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Chip } from '@/components/ui/Chip'
import { mockTrips } from '@/lib/mock-data'
import type { Trip } from '@/lib/types'

type Filter = 'Hoy' | 'Semana' | 'Historial'

const STATUS_LABELS: Record<string, string> = {
  active: 'En curso', completed: 'Completado', closed: 'Cerrado', cancelled: 'Cancelado',
}

function TripRow({ trip }: { trip: Trip }) {
  const { setActiveTrip } = useAppStore()
  const isActive = trip.status === 'active'

  return (
    <article className={`list-card${isActive ? ' accent-left' : ''}`}>
      <div>
        <small>{STATUS_LABELS[trip.status]} · {trip.id}</small>
        <strong>{trip.origin.address.split(',')[0]} a {trip.destination.address.split(',')[0]}</strong>
        <p>{trip.etaMin} min · ${trip.estimatedMXN.toLocaleString('es-MX')}</p>
      </div>
      {isActive ? (
        <button className="btn-mini" onClick={() => setActiveTrip(trip)} aria-label="Abrir viaje activo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
            <path d="M9 18 15 12 9 6"/>
          </svg>
        </button>
      ) : (
        <Chip status={trip.status}>
          {trip.status === 'completed' ? 'Pagado' : 'Cerrado'}
        </Chip>
      )}
    </article>
  )
}

export default function ViajesPage() {
  const [filter, setFilter] = useState<Filter>('Hoy')
  const activeCount = mockTrips.filter(t => t.status === 'active').length
  const filters: Filter[] = ['Hoy', 'Semana', 'Historial']

  return (
    <>
      <div className="section-head">
        <h2>Viajes</h2>
        {activeCount > 0 && <Chip variant="warning">{activeCount} activo</Chip>}
      </div>

      <div className="segmented" role="tablist" aria-label="Filtro de viajes">
        {filters.map(f => (
          <button key={f} role="tab" aria-selected={filter === f}
            className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="stack">
        {mockTrips.map(t => <TripRow key={t.id} trip={t} />)}
      </div>
    </>
  )
}