import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate URL format before creating client
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Only create client if we have valid credentials
export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey 
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null

// Also export createClient for components that need it
export const createClient = () => {
  if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured')
    return null
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Helper to get current user
export const getCurrentUser = async () => {
  if (!supabase) return null
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
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { error } = await supabase.auth.signOut()
  return { error }
}
