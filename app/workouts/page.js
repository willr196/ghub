'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

const workoutTypes = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Sports', 'Other']

export default function WorkoutsPage() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'Strength', duration: 30, calories: 200, notes: '' })

  useEffect(() => { if (user) fetchWorkouts() }, [user])

  const fetchWorkouts = async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      
      if (fetchError) throw fetchError
      setWorkouts(data || [])
      setError(null)
    } catch (e) {
      console.error('Error fetching workouts:', e)
      setError('Failed to load workouts. Please try again.')
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

    try {
      const { error: insertError } = await supabase
        .from('workouts')
        .insert([{ ...formData, user_id: user.id, date: new Date().toISOString().split('T')[0] }])
      
      if (insertError) throw insertError
      
      await fetchWorkouts()
      setShowForm(false)
      setFormData({ name: '', type: 'Strength', duration: 30, calories: 200, notes: '' })
    } catch (e) {
      console.error('Error saving workout:', e)
      setError('Failed to save workout. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this workout?')) return
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    try {
      const { error: deleteError } = await supabase.from('workouts').delete().eq('id', id)
      if (deleteError) throw deleteError
      await fetchWorkouts()
    } catch (e) {
      console.error('Error deleting workout:', e)
      setError('Failed to delete workout. Please try again.')
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
        <div className="max-w-5xl mx-auto animate-fadeIn space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold">🏋️ Workout Tracker</h1>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancel' : '+ Add Workout'}
            </button>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
              {error}
              <button onClick={() => setError(null)} className="ml-4 text-error/70 hover:text-error">✕</button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <h3 className="font-display text-lg font-semibold">Log New Workout</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Workout Name</label>
                  <input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g., Morning Run" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    {workoutTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration (min)</label>
                  <input 
                    type="number" 
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})} 
                    min="1" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Calories Burned</label>
                  <input 
                    type="number" 
                    value={formData.calories} 
                    onChange={(e) => setFormData({...formData, calories: parseInt(e.target.value) || 0})} 
                    min="0" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  placeholder="How did it go?" 
                  rows={3} 
                />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Workout'}
              </button>
            </form>
          )}

          <div className="card">
            <h3 className="font-display text-lg font-semibold mb-4">Workout History</h3>
            {workouts.length > 0 ? (
              <div className="space-y-3">
                {workouts.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{w.name}</span>
                        <span className="text-xs px-2 py-1 bg-primary/20 text-primary-light rounded">{w.type}</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {new Date(w.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-gray-400">⏱️ {w.duration} min</span>
                      <span className="text-sm text-gray-400">🔥 {w.calories} kcal</span>
                      <button 
                        onClick={() => handleDelete(w.id)} 
                        className="text-error hover:text-red-400 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No workouts logged yet. Add your first workout above!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
