import { redirect } from 'next/navigation'
import { hasAdminAccess, hasDriverAccess } from '@/lib/auth-guards'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  if (await hasDriverAccess(supabase, user)) {
    redirect('/panel')
  }

  if (await hasAdminAccess(supabase, user)) {
    redirect('/conductores')
  }

  redirect('/sin-acceso')
}
