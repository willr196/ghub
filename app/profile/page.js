'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ display_name: '', email: '', avatar_url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => { if (user) fetchProfile() }, [user])

  const fetchProfile = async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError
      if (data) {
        setProfile({
          display_name: data.display_name || '',
          email: data.email || user.email || '',
          avatar_url: data.avatar_url || ''
        })
      }
      setError(null)
    } catch (e) {
      console.error('Error fetching profile:', e)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      console.error('Error updating profile:', e)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="spinner" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-2xl mx-auto animate-fadeIn space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">👤 Profile Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account information</p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
              {error}
              <button onClick={() => setError(null)} className="ml-4 text-error/70 hover:text-error">✕</button>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg">
              ✓ Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="card space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl mx-auto mb-4">
                {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : '👤'}
              </div>
              <p className="text-gray-400 text-sm">Profile Avatar</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input
                value={profile.display_name}
                onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Avatar URL (optional)</label>
              <input
                type="url"
                value={profile.avatar_url}
                onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <div className="card">
            <h3 className="font-display text-lg font-semibold mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400">User ID</span>
                <span className="text-sm font-mono text-gray-500">{user?.id?.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400">Account Created</span>
                <span className="text-sm">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="card bg-warning/10 border-warning/20">
            <h3 className="font-display text-lg font-semibold mb-2 text-warning">🔐 Security</h3>
            <p className="text-gray-400 text-sm">
              To change your password or manage authentication settings, please use the Supabase dashboard or contact support.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
