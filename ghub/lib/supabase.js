import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null

// Also export createClient for components that need it
export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured')
    return null
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser()
  return !!user
}

// Sign out helper
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}
