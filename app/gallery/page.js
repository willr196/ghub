'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

export default function GalleryPage() {
  const { user, isAuthenticated } = useAuth()
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => { fetchMedia() }, [user])

  const fetchMedia = async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('gallery')
        .select('*')
        .order('date', { ascending: false })

      // Show public media + user's own media if logged in
      if (user) {
        query = query.or(`is_public.eq.true,user_id.eq.${user.id}`)
      } else {
        query = query.eq('is_public', true)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setMedia(data || [])
      setError(null)
    } catch (e) {
      console.error('Error fetching gallery:', e)
      setError('Failed to load gallery. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchMedia()
    } catch (e) {
      console.error('Error deleting media:', e)
      setError('Failed to delete item. Please try again.')
    }
  }

  const categories = ['All', 'Progress', 'Workouts', 'Meals', 'Achievements']
  const filteredMedia = filter === 'All' ? media : media.filter(m => m.category === filter)

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
        <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
          <h1 className="font-display text-3xl font-bold">📸 Progress Gallery</h1>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
              {error}
              <button onClick={() => setError(null)} className="ml-4 text-error/70 hover:text-error">✕</button>
            </div>
          )}

          <div className="flex gap-2">
            {categories.map(c => (
              <button 
                key={c} 
                onClick={() => setFilter(c)} 
                className={`px-4 py-2 rounded-full text-sm ${
                  filter === c 
                    ? 'gradient-bg' 
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {isAuthenticated && (
            <div className="card border-2 border-dashed border-white/10 text-center py-12">
              <span className="text-4xl">📤</span>
              <p className="text-gray-400 mt-2">Upload coming soon</p>
            </div>
          )}

          {filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl group"
                >
                  {item.type === 'video' ? '🎬' : '📷'}
                  {user && item.user_id === user.id && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-2 right-2 bg-error text-white px-2 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <span className="text-4xl">📸</span>
              <p className="text-gray-400 mt-4">No photos yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
