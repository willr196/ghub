'use client'

import { useState, useEffect, useCallback, Suspense} from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLocalDateString } from '@/lib/date'
import { useAuth } from '@/components/AuthProvider'
import RequireAuth from '@/components/RequireAuth'
import Sidebar from '@/components/Sidebar'

const workoutTypes = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Sports', 'Other']
// Next.js requires useSearchParams() to be used within a Suspense boundary
// when a page can be statically prerendered.
export default function WorkoutsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 flex items-center justify-center">
            <div className="spinner" />
          </main>
        </div>
      }
    >
      <WorkoutsPageInner />
    </Suspense>
  )
}


function WorkoutsPageInner() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [overloadTip, setOverloadTip] = useState('')
  const [nextWorkoutLink, setNextWorkoutLink] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showExercises, setShowExercises] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Strength',
    duration: 30,
    calories: 200,
    notes: '',
    exercises: []
  })

  const fetchWorkouts = useCallback(async () => {
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
  }, [user])

  useEffect(() => { if (user) fetchWorkouts() }, [user, fetchWorkouts])
  useEffect(() => {
    if (searchParams.get('onboarding') === '1') {
      setShowForm(true)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage('')
    setOverloadTip('')
    setNextWorkoutLink('')

    try {
      const { error: insertError } = await supabase
        .from('workouts')
        .insert([{
          name: formData.name,
          type: formData.type,
          duration: formData.duration,
          calories: formData.calories,
          notes: formData.notes,
          exercises: formData.exercises.length > 0 ? formData.exercises.filter(e => e.name.trim()) : null,
          user_id: user.id,
          date: getLocalDateString()
        }])

      if (insertError) throw insertError

      const { data: recentSame, error: recentSameError } = await supabase
        .from('workouts')
        .select('id, duration, calories, exercises, created_at')
        .eq('user_id', user.id)
        .eq('type', formData.type)
        .order('created_at', { ascending: false })
        .limit(2)

      if (recentSameError) throw recentSameError

      const previous = recentSame && recentSame.length > 1 ? recentSame[1] : null
      const current = {
        duration: formData.duration,
        calories: formData.calories,
        exercises: formData.exercises
      }

      const getVolume = (workout) => {
        if (!workout?.exercises || workout.exercises.length === 0) return null
        return workout.exercises.reduce((sum, ex) => {
          const sets = Number(ex.sets) || 0
          const reps = Number(ex.reps) || 0
          const weightMatch = String(ex.weight || '').match(/[\d.]+/)
          const weight = weightMatch ? Number(weightMatch[0]) : 0
          return sum + (sets * reps * weight)
        }, 0)
      }

      const currentVolume = getVolume(current)
      const previousVolume = getVolume(previous)

      let tip = 'Great start. Next time, add a small increase (1 rep or 5 minutes).'
      if (previous) {
        if (currentVolume !== null && previousVolume !== null) {
          if (currentVolume <= previousVolume) {
            tip = 'Next time, aim for +1 rep per set or +5 lb on one lift.'
          } else {
            tip = 'Nice increase. Keep it steady or add 1-2 reps next time.'
          }
        } else if ((current.duration || 0) <= (previous.duration || 0)) {
          tip = 'Next time, try +5 minutes or a slightly higher pace.'
        } else {
          tip = 'Nice. Keep duration steady and add intensity next time.'
        }
      }

      const toCalendarDate = (date) => {
        const pad = (n) => String(n).padStart(2, '0')
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
      }

      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + 1)
      const start = toCalendarDate(nextDate)
      const endDate = new Date(nextDate)
      endDate.setDate(endDate.getDate() + 1)
      const end = toCalendarDate(endDate)
      const title = encodeURIComponent(`Next ${formData.type} session`)
      const details = encodeURIComponent('Planned workout from GHUB. Keep the streak going.')
      setNextWorkoutLink(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`)

      setSuccessMessage('Workout saved.')
      setOverloadTip(tip)

      await fetchWorkouts()
      setShowForm(false)
      setShowExercises(false)
      setFormData({ name: '', type: 'Strength', duration: 30, calories: 200, notes: '', exercises: [] })
    } catch (e) {
      console.error('Error saving workout:', e)
      setError('Failed to save workout. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { name: '', sets: 3, reps: 10, weight: '' }]
    })
  }

  const removeExercise = (index) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index)
    })
  }

  const updateExercise = (index, field, value) => {
    const updated = [...formData.exercises]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, exercises: updated })
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

  const content = loading ? (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 flex items-center justify-center">
        <div className="spinner" />
      </main>
    </div>
  ) : (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-5xl mx-auto animate-fadeIn space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold">🏋️ Workout Tracker</h1>
            <button onClick={() => setShowForm(!showForm)} aria-expanded={showForm} className="btn-primary">
              {showForm ? 'Cancel' : '+ Add Workout'}
            </button>
          </div>

          {searchParams.get('onboarding') === '1' && (
            <div className="bg-primary/10 border border-primary/20 text-primary-light px-4 py-3 rounded-lg">
              Start strong: log your first workout to establish your baseline.
            </div>
          )}

          {successMessage && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg">
              <div className="font-medium">{successMessage}</div>
              {overloadTip && <div className="text-sm text-gray-400 mt-1">{overloadTip}</div>}
              {nextWorkoutLink && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <a
                    href={nextWorkoutLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-sm"
                  >
                    Schedule next workout
                  </a>
                  <a href="/library" className="text-sm text-gray-400 hover:text-white">
                    Build a routine in the library →
                  </a>
                </div>
              )}
            </div>
          )}

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

              <div className="border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExercises(!showExercises)}
                  className="btn-secondary w-full mb-4"
                >
                  {showExercises ? '- Hide Exercises' : '+ Add Individual Exercises (Optional)'}
                </button>

                {showExercises && (
                  <div className="space-y-3">
                    {formData.exercises.map((exercise, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Exercise {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          aria-label={`Remove exercise ${index + 1}`}
                          className="text-error text-sm hover:text-red-400"
                        >
                          Remove
                        </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <input
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                            placeholder="Exercise name (e.g., Bench Press)"
                          />
                          <input
                            value={exercise.weight}
                            onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                            placeholder="Weight (e.g., 135 lbs)"
                          />
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                            placeholder="Sets"
                            min="1"
                          />
                          <input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 0)}
                            placeholder="Reps"
                            min="1"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addExercise}
                      className="btn-secondary w-full text-sm"
                    >
                      + Add Another Exercise
                    </button>
                  </div>
                )}
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
                  <div key={w.id} className="p-4 bg-white/5 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
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
                          aria-label={`Delete workout ${w.name}`}
                          className="text-error hover:text-red-400 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {w.exercises && w.exercises.length > 0 && (
                      <div className="pl-4 border-l-2 border-primary/30 space-y-2">
                        {w.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">{ex.name}</span>
                            <span className="text-gray-500">
                              {ex.sets} × {ex.reps}
                              {ex.weight && ` @ ${ex.weight}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {w.notes && (
                      <p className="text-sm text-gray-400 italic">{w.notes}</p>
                    )}
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

  return <RequireAuth>{content}</RequireAuth>
}
