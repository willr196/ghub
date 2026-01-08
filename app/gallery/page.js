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
      const { data, error: fetchError } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_public', true)
        .order('date', { ascending: false })
      
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
                  className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl"
                >
                  {item.type === 'video' ? '🎬' : '📷'}
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
