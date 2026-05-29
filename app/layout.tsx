import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import SettingsSheet from '@/components/layout/SettingsSheet'
import TripSheet from '@/components/trip/TripSheet'
import Toast from '@/components/ui/Toast'
import { mockDriver, mockDocuments } from '@/lib/mock-data'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-shell">
      <TopBar driver={mockDriver} />
      <BottomNav />
      <main className="page-content" id="main-content">
        {children}
      </main>
      <SettingsSheet documents={mockDocuments} />
      <TripSheet />
      <Toast />
    </div>
  )
}