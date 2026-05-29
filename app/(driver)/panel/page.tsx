
// ════════════════════════════════════════════════════════════════════
// app/(driver)/panel/page.tsx
// ════════════════════════════════════════════════════════════════════
import DriverCard from '@/components/driver/DriverCard'
import AvailabilityToggle from '@/components/driver/AvailabilityToggle'
import ActiveTripCard from '@/components/trip/ActiveTripCard'
import WeeklyMetrics from '@/components/driver/WeeklyMetrics'
import AlertsList from '@/components/driver/AlertsList'
import { mockDriver, mockTrips, mockEarnings, mockAlerts } from '@/lib/mock-data'

export default function PanelPage() {
  const activeTrip = mockTrips.find(t => t.status === 'active') ?? null

  return (
    <>
      <DriverCard driver={mockDriver} />
      <AvailabilityToggle />
      {activeTrip && <ActiveTripCard trip={activeTrip} />}
      <WeeklyMetrics earnings={mockEarnings} />
      <AlertsList alerts={mockAlerts} />
    </>
  )
}
