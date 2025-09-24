'use server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function handleSignIn({ email, password }: { email: string; password: string }) {
  const supabase = createServerSupabaseClient()
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    return { error: authError.message }
  }

  if (data.user) {
    const organizationId = data.user.user_metadata?.organization_id
    if (!organizationId) {
      return { error: 'User account is not properly configured. Please contact support.' }
    }
    return { success: true }
  }
  return { error: 'No user found.' }
}