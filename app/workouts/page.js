'use client'

import { useState, useEffect, useCallback, Suspense} from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLocalDateString } from '@/lib/date'
import { useAuth } from '@/components/AuthProvider'
import RequireAuth from '@/components/RequireAuth'
import Sidebar from '@/components/Sidebar'

const workoutTypes = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Sports', 'Other']
const guidedGoals = ['Cardio', 'Muscle gain']
const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full body']
const cardioModes = ['Treadmill', 'Bike', 'Rower', 'Stairmaster', 'Elliptical', 'Other']

function slugTag(v) {
  return String(v || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
}

function suggestedWorkoutsFor(goal, option) {
  // All suggestions prefill the log form; user can adjust before saving.
  if (goal === 'Cardio') {
    const base = {
      type: 'Cardio',
      duration: 30,
      calories: 250,
      notes: '#cardio',
      exercises: []
    }
    const by = {
      Treadmill: { name: 'Treadmill Run', duration: 30, calories: 300, notes: '#cardio #treadmill' },
      Bike: { name: 'Stationary Bike', duration: 35, calories: 280, notes: '#cardio #bike' },
      Rower: { name: 'Rowing Machine', duration: 25, calories: 260, notes: '#cardio #rower' },
      Stairmaster: { name: 'StairMaster', duration: 20, calories: 230, notes: '#cardio #stairs' },
      Elliptical: { name: 'Elliptical', duration: 30, calories: 260, notes: '#cardio #elliptical' }
    }
    const pick = by[option] || { name: 'Cardio Session', notes: '#cardio' }
    return [{ ...base, ...pick }]
  }

  if (goal === 'Muscle gain') {
    const mk = (name, notes, exercises) => ({
      name,
      type: 'Strength',
      duration: 45,
      calories: 0,
      notes,
      exercises
    })

    const chest = [
      mk('Chest Hypertrophy', '#muscle-gain #chest', [
        { name: 'Bench Press', equipment: 'Barbell', sets: 4, reps: 6, weight: '' },
        { name: 'Incline Dumbbell Press', equipment: 'Dumbbells', sets: 3, reps: 10, weight: '' },
        { name: 'Chest Fly', equipment: 'Cable or Pec Deck', sets: 3, reps: 12, weight: '' },
        { name: 'Push-ups', equipment: 'Bodyweight', sets: 3, reps: 12, weight: '' }
      ])
    ]
    const back = [
      mk('Back Hypertrophy', '#muscle-gain #back', [
        { name: 'Lat Pulldown', equipment: 'Cable Machine', sets: 4, reps: 10, weight: '' },
        { name: 'Seated Row', equipment: 'Cable Machine', sets: 3, reps: 10, weight: '' },
        { name: 'One-arm Dumbbell Row', equipment: 'Dumbbells', sets: 3, reps: 10, weight: '' },
        { name: 'Face Pull', equipment: 'Cable Machine', sets: 3, reps: 15, weight: '' }
      ])
    ]
    const legs = [
      mk('Legs Hypertrophy', '#muscle-gain #legs', [
        { name: 'Squat', equipment: 'Barbell', sets: 4, reps: 6, weight: '' },
        { name: 'Leg Press', equipment: 'Machine', sets: 3, reps: 10, weight: '' },
        { name: 'Romanian Deadlift', equipment: 'Barbell or Dumbbells', sets: 3, reps: 8, weight: '' },
        { name: 'Leg Curl', equipment: 'Machine', sets: 3, reps: 12, weight: '' },
        { name: 'Calf Raise', equipment: 'Machine or Bodyweight', sets: 3, reps: 15, weight: '' }
      ])
    ]
    const shoulders = [
      mk('Shoulders Hypertrophy', '#muscle-gain #shoulders', [
        { name: 'Overhead Press', equipment: 'Barbell or Dumbbells', sets: 4, reps: 6, weight: '' },
        { name: 'Lateral Raise', equipment: 'Dumbbells', sets: 3, reps: 12, weight: '' },
        { name: 'Rear Delt Fly', equipment: 'Dumbbells or Machine', sets: 3, reps: 12, weight: '' },
        { name: 'Upright Row', equipment: 'Cable or Barbell', sets: 2, reps: 12, weight: '' }
      ])
    ]
    const arms = [
      mk('Arms Hypertrophy', '#muscle-gain #arms', [
        { name: 'Biceps Curl', equipment: 'Dumbbells', sets: 3, reps: 12, weight: '' },
        { name: 'Hammer Curl', equipment: 'Dumbbells', sets: 3, reps: 10, weight: '' },
        { name: 'Triceps Pushdown', equipment: 'Cable Machine', sets: 3, reps: 12, weight: '' },
        { name: 'Overhead Triceps Extension', equipment: 'Cable or Dumbbell', sets: 3, reps: 10, weight: '' }
      ])
    ]
    const core = [
      mk('Core', '#muscle-gain #core', [
        { name: 'Plank', equipment: 'Bodyweight', sets: 3, reps: 45, weight: '' },
        { name: 'Hanging Knee Raise', equipment: 'Pull-up Bar', sets: 3, reps: 10, weight: '' },
        { name: 'Cable Crunch', equipment: 'Cable Machine', sets: 3, reps: 12, weight: '' },
        { name: 'Pallof Press', equipment: 'Cable Machine', sets: 3, reps: 12, weight: '' }
      ])
    ]
    const full = [
      mk('Full Body Strength', '#muscle-gain #full-body', [
        { name: 'Squat', equipment: 'Barbell', sets: 3, reps: 5, weight: '' },
        { name: 'Bench Press', equipment: 'Barbell', sets: 3, reps: 5, weight: '' },
        { name: 'Deadlift', equipment: 'Barbell', sets: 2, reps: 5, weight: '' },
        { name: 'Lat Pulldown', equipment: 'Cable Machine', sets: 3, reps: 10, weight: '' }
      ])
    ]

    const map = {
      Chest: chest,
      Back: back,
      Legs: legs,
      Shoulders: shoulders,
      Arms: arms,
      Core: core,
      'Full body': full
    }

    return map[option] || []
  }

  return []
}

function extractTags(notes) {
  if (!notes) return []
  const tags = []
  const re = /#([a-z0-9][a-z0-9_-]*)/gi
  let m
  while ((m = re.exec(notes)) !== null) tags.push(m[1].toLowerCase())
  return [...new Set(tags)]
}

function normalizeText(v) {
  return String(v || '').toLowerCase().trim()
}
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
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [overloadTip, setOverloadTip] = useState('')
  const [nextWorkoutLink, setNextWorkoutLink] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showExercises, setShowExercises] = useState(false)
  const [typeFilter, setTypeFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('All')
  const [equipmentFilter, setEquipmentFilter] = useState('All')
  const [copied, setCopied] = useState(false)
  const [guidedGoal, setGuidedGoal] = useState(null) // 'Cardio' | 'Muscle gain'
  const [guidedOption, setGuidedOption] = useState(null)
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

  const fetchTemplates = useCallback(async () => {
    if (!supabase) return
    try {
      const { data, error: fetchError } = await supabase
        .from('workout_library')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      setTemplates(data || [])
    } catch (e) {
      console.error('Error fetching workout templates:', e)
      // Keep page usable if templates fail; user can still log manually.
    }
  }, [user])

  useEffect(() => { if (user) fetchWorkouts() }, [user, fetchWorkouts])
  useEffect(() => { if (user) fetchTemplates() }, [user, fetchTemplates])
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
      exercises: [...formData.exercises, { name: '', equipment: '', sets: 3, reps: 10, weight: '' }]
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

  const allTags = (() => {
    const set = new Set()
    for (const w of workouts) {
      for (const t of extractTags(w.notes)) set.add(t)
    }
    return Array.from(set).sort()
  })()

  const allEquipment = (() => {
    const set = new Set()
    for (const w of workouts) {
      for (const ex of w.exercises || []) {
        const v = normalizeText(ex?.equipment)
        if (v) set.add(v)
      }
    }
    return Array.from(set).sort()
  })()

  const filteredWorkouts = workouts.filter((w) => {
    if (typeFilter !== 'All' && w.type !== typeFilter) return false
    if (tagFilter !== 'All') {
      const tags = extractTags(w.notes)
      if (!tags.includes(tagFilter)) return false
    }
    if (equipmentFilter !== 'All') {
      const eq = normalizeText(equipmentFilter)
      const has = (w.exercises || []).some((ex) => normalizeText(ex?.equipment) === eq)
      if (!has) return false
    }
    const q = normalizeText(searchQuery)
    if (!q) return true
    const haystack = [
      w.name,
      w.type,
      w.notes,
      ...(w.exercises || []).flatMap((ex) => [ex?.name, ex?.equipment, ex?.weight])
    ]
      .map(normalizeText)
      .filter(Boolean)
      .join(' ')
    return haystack.includes(q)
  })

  const copyForGPT = async () => {
    try {
      const payload = filteredWorkouts.map((w) => ({
        date: w.date,
        name: w.name,
        type: w.type,
        duration_min: w.duration,
        calories: w.calories,
        tags: extractTags(w.notes),
        notes: w.notes || '',
        exercises: (w.exercises || []).map((ex) => ({
          name: ex?.name || '',
          equipment: ex?.equipment || '',
          sets: ex?.sets ?? null,
          reps: ex?.reps ?? null,
          weight: ex?.weight || ''
        }))
      }))

      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('Failed to copy:', e)
      setError('Copy failed. Your browser may be blocking clipboard access.')
    }
  }

  const addTagToNotes = (tag) => {
    const t = tag.startsWith('#') ? tag : `#${tag}`
    const current = formData.notes || ''
    if (extractTags(current).includes(t.slice(1).toLowerCase())) return
    const next = current.trim().length === 0 ? t : `${current.trim()} ${t}`
    setFormData({ ...formData, notes: next })
  }

  const loadSuggestedWorkout = (suggestion) => {
    setShowForm(true)
    setShowExercises(Boolean(suggestion.exercises && suggestion.exercises.length > 0))
    setFormData({
      name: suggestion.name || '',
      type: suggestion.type || 'Strength',
      duration: suggestion.duration ?? 30,
      calories: suggestion.calories ?? 0,
      notes: suggestion.notes || '',
      exercises: suggestion.exercises || []
    })
    // Prime filters so the newly-logged workout is easier to find later.
    if (suggestion.type) setTypeFilter('All')
    const tags = extractTags(suggestion.notes)
    if (tags.length > 0) setTagFilter('All')
  }

  const templateToSuggestion = (tpl) => {
    const goal = tpl.goal || 'Muscle gain'
    const notes = goal === 'Cardio'
      ? `From template: ${tpl.name} #cardio${tpl.cardio_mode ? ` #${slugTag(tpl.cardio_mode)}` : ''}`
      : `From template: ${tpl.name} #muscle-gain${tpl.muscle_group ? ` #${slugTag(tpl.muscle_group)}` : ''}`

    return {
      name: tpl.name,
      type: goal === 'Cardio' ? 'Cardio' : 'Strength',
      duration: tpl.estimated_duration ?? 45,
      calories: 0,
      notes,
      exercises: tpl.exercises || []
    }
  }

  const cardioTemplates = templates.filter((t) => (t.goal || 'Muscle gain') === 'Cardio')
  const muscleTemplates = templates.filter((t) => (t.goal || 'Muscle gain') !== 'Cardio')

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

          <div className="card">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Quick Start</h3>
                <p className="text-sm text-gray-500">
                  Pick a goal, then choose a muscle group or cardio option. We’ll auto-fill the workout log for you.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {guidedGoals.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGuidedGoal((cur) => (cur === g ? null : g))
                      setGuidedOption(null)
                    }}
                    className={guidedGoal === g ? 'btn-primary' : 'btn-secondary'}
                  >
                    {g === 'Cardio' ? 'Cardio' : 'Muscle gain'}
                  </button>
                ))}
              </div>
            </div>

            {guidedGoal === 'Cardio' && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {cardioModes.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setGuidedOption((cur) => (cur === o ? null : o))}
                      className={guidedOption === o ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                    >
                      {o}
                    </button>
                  ))}
                </div>

                {guidedOption && (
                  <div className="grid md:grid-cols-2 gap-3">
                    {(
                      cardioTemplates
                        .filter((t) => (t.cardio_mode || 'Other') === guidedOption)
                        .map(templateToSuggestion)
                    ).concat(
                      cardioTemplates.length === 0 ? suggestedWorkoutsFor('Cardio', guidedOption) : []
                    ).map((s, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-sm text-gray-500">
                              {s.duration} min • {s.type}
                            </div>
                          </div>
                          <button type="button" onClick={() => loadSuggestedWorkout(s)} className="btn-primary text-sm">
                            Use
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">Adds: {s.notes}</div>
                      </div>
                    ))}
                  </div>
                )}

                {cardioTemplates.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No cardio templates yet. Create one in the Library for better suggestions.
                    {' '}
                    <a href="/library" className="text-gray-400 hover:text-white underline underline-offset-4">
                      Go to Library
                    </a>
                  </p>
                )}
              </div>
            )}

            {guidedGoal === 'Muscle gain' && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {muscleGroups.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGuidedOption((cur) => (cur === g ? null : g))}
                      className={guidedOption === g ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                {guidedOption && (
                  <div className="grid md:grid-cols-2 gap-3">
                    {(
                      muscleTemplates
                        .filter((t) => (t.muscle_group || 'Full body') === guidedOption)
                        .map(templateToSuggestion)
                    ).concat(
                      muscleTemplates.length === 0 ? suggestedWorkoutsFor('Muscle gain', guidedOption) : []
                    ).map((s, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-lg space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-sm text-gray-500">
                              {s.type} • {s.duration} min
                            </div>
                          </div>
                          <button type="button" onClick={() => loadSuggestedWorkout(s)} className="btn-primary text-sm">
                            Use
                          </button>
                        </div>
                        <div className="space-y-1">
                          {(s.exercises || []).slice(0, 6).map((ex, idx) => (
                            <div key={idx} className="text-sm text-gray-400 flex items-center justify-between gap-3">
                              <span className="text-gray-300">
                                {ex.name}
                                {ex.equipment && <span className="text-gray-500"> ({ex.equipment})</span>}
                              </span>
                              <span className="text-gray-500">{ex.sets} × {ex.reps}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">Adds: {s.notes}</div>
                      </div>
                    ))}
                  </div>
                )}

                {muscleTemplates.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No muscle-gain templates yet. Create one in the Library for better suggestions.
                    {' '}
                    <a href="/library" className="text-gray-400 hover:text-white underline underline-offset-4">
                      Go to Library
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

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
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => addTagToNotes('cardio')} className="btn-secondary text-xs">
                    + #cardio
                  </button>
                  <button type="button" onClick={() => addTagToNotes('muscle-gain')} className="btn-secondary text-xs">
                    + #muscle-gain
                  </button>
                  <button type="button" onClick={() => addTagToNotes('strength')} className="btn-secondary text-xs">
                    + #strength
                  </button>
                  <button type="button" onClick={() => addTagToNotes('mobility')} className="btn-secondary text-xs">
                    + #mobility
                  </button>
                  <span className="text-xs text-gray-500 self-center">
                    Tip: use `#tags` in notes to filter later.
                  </span>
                </div>
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
                            value={exercise.equipment || ''}
                            onChange={(e) => updateExercise(index, 'equipment', e.target.value)}
                            placeholder="Equipment/Machine (e.g., Smith machine)"
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold">Workout History</h3>
                <p className="text-sm text-gray-500">
                  Filter by type, tags, equipment, or search exercises.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={copyForGPT} className="btn-secondary text-sm">
                  {copied ? 'Copied' : 'Copy for GPT'}
                </button>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTypeFilter('All')}
                  className={typeFilter === 'All' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                >
                  All
                </button>
                {workoutTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={typeFilter === t ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search (e.g., treadmill, bench, 135, legs)"
                />
                <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                  <option value="All">All tags</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>
                      #{t}
                    </option>
                  ))}
                </select>
                <select value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)}>
                  <option value="All">All equipment</option>
                  {allEquipment.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 self-center">Quick tags:</span>
                  {allTags.slice(0, 12).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTagFilter((cur) => (cur === t ? 'All' : t))}
                      className={tagFilter === t ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
                      title={`Filter by #${t}`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {workouts.length > 0 ? (
              <div className="space-y-3">
                {filteredWorkouts.map((w) => (
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
                            <span className="text-gray-300">
                              {ex.name}
                              {ex.equipment && <span className="text-gray-500"> ({ex.equipment})</span>}
                            </span>
                            <span className="text-gray-500">
                              {ex.sets} × {ex.reps}
                              {ex.weight && ` @ ${ex.weight}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {w.notes && (
                      <div className="text-sm text-gray-400 italic space-y-2">
                        <p>{w.notes}</p>
                        {extractTags(w.notes).length > 0 && (
                          <div className="flex flex-wrap gap-2 not-italic">
                            {extractTags(w.notes).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setTagFilter((cur) => (cur === t ? 'All' : t))}
                                className={tagFilter === t ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
                                title={`Filter by #${t}`}
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
