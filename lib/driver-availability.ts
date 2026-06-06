import type { SupabaseClient } from '@supabase/supabase-js'

type DriverAvailabilityStatus = 'disponible' | 'en_viaje'

export async function updateDriverAvailabilityBestEffort(
  supabase: SupabaseClient,
  context: string,
  driverId: string,
  tripId: string,
  availabilityStatus: DriverAvailabilityStatus
) {
  const { error } = await supabase
    .from('drivers')
    .update({ availability_status: availabilityStatus })
    .eq('id', driverId)

  if (error) {
    console.error(`[${context}] availability_status update failed:`, error.message, {
      driverId,
      tripId,
      availabilityStatus,
    })
  }
}
