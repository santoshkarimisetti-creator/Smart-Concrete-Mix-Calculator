import { supabase } from './supabase'

export async function ensureProfile(user) {
  if (!user?.id) {
    return { data: null, error: null }
  }

  const profile = {
    user_id: user.id,
    full_name: user.user_metadata?.full_name ?? '',
    email: user.email ?? '',
  }

  return supabase.from('profiles').upsert(profile, {
    onConflict: 'user_id',
    ignoreDuplicates: true,
  })
}