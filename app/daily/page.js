'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLocalDateString } from '@/lib/date'
import { useAuth } from '@/components/AuthProvider'
import RequireAuth from '@/components/RequireAuth'
import Sidebar from '@/components/Sidebar'

export default function DailyPage() {
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
      <DailyPageInner />
    </Suspense>
  )
}

function DailyPageInner() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [log, setLog] = useState({ water_intake: 0, sleep_hours: 7, sleep_quality: 3, mood: 'okay', energy: 3, notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const today = getLocalDateString()

  const fetchLog = useCallback(async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      
      // single() throws error if no row found, which is okay for new days
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError
      if (data) setLog(data)
      setError(null)
    } catch (e) {
      console.error('Error fetching log:', e)
      setError('Failed to load today\'s log')
    } finally {
      setLoading(false)
    }
  }, [today, user])

  useEffect(() => { if (user) fetchLog() }, [user, fetchLog])

  const saveLog = async () => {
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Check if log exists for today
      const { data: existing, error: checkError } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      
      // Ignore "no rows" error
      if (checkError && checkError.code !== 'PGRST116') throw checkError

      if (existing) {
        // Update existing log
        const { error: updateError } = await supabase
          .from('daily_logs')
          .update({
            water_intake: log.water_intake,
            sleep_hours: log.sleep_hours,
            sleep_quality: log.sleep_quality,
            mood: log.mood,
            energy: log.energy,
            notes: log.notes
          })
          .eq('id', existing.id)
        
        if (updateError) throw updateError
      } else {
        // Insert new log
        const { error: insertError } = await supabase
          .from('daily_logs')
          .insert([{ 
            ...log, 
            user_id: user.id, 
            date: today 
          }])
        
        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      console.error('Error saving log:', e)
      setError('Failed to save log. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const moods = [
    { emoji: '😢', value: 'sad' },
    { emoji: '😕', value: 'meh' },
    { emoji: '😐', value: 'okay' },
    { emoji: '🙂', value: 'good' },
    { emoji: '😄', value: 'great' }
  ]

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
        <div className="max-w-4xl mx-auto animate-fadeIn space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">☀️ Daily Wellness Log</h1>
            <p className="text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {searchParams.get('onboarding') === '1' && (
            <div className="bg-primary/10 border border-primary/20 text-primary-light px-4 py-3 rounded-lg">
              Quick recovery check-in to build consistency.
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
              {error}
              <button onClick={() => setError(null)} className="ml-4 text-error/70 hover:text-error">✕</button>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg">
              ✓ Today&apos;s log saved successfully!
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Water Tracker */}
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">💧 Water Intake</h3>
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(8)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setLog({...log, water_intake: i + 1})} 
                    aria-label={`Set water intake to ${i + 1} glasses`}
                    className={`text-3xl transition-all ${i < log.water_intake ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-50'}`}
                  >
                    💧
                  </button>
                ))}
              </div>
              <p className="text-center text-gray-400">{log.water_intake} of 8 glasses</p>
            </div>

            {/* Sleep Tracker */}
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">😴 Sleep Tracker</h3>
              <div className="text-center mb-4">
                <input 
                  type="number" 
                  value={log.sleep_hours} 
                  onChange={(e) => setLog({...log, sleep_hours: parseFloat(e.target.value) || 0})} 
                  step="0.5" 
                  min="0" 
                  max="24" 
                  className="w-24 text-center text-4xl font-display font-bold bg-transparent border-b-2 border-accent" 
                />
                <span className="text-gray-400 ml-2">hours</span>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-400 block mb-2">Quality</span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(q => (
                  <button 
                    key={q} 
                    onClick={() => setLog({...log, sleep_quality: q})} 
                    aria-label={`Set sleep quality to ${q} out of 5`}
                    className={`text-2xl ${log.sleep_quality >= q ? 'opacity-100' : 'opacity-30'}`}
                  >
                    ⭐
                  </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mood Tracker */}
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">🌈 Mood</h3>
              <div className="flex justify-center gap-4">
                {moods.map(m => (
                  <button 
                    key={m.value} 
                    onClick={() => setLog({...log, mood: m.value})} 
                    aria-label={`Set mood to ${m.value}`}
                    className={`text-4xl transition-all ${log.mood === m.value ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Tracker */}
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">⚡ Energy Level</h3>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(e => (
                  <button 
                    key={e} 
                    onClick={() => setLog({...log, energy: e})} 
                    aria-label={`Set energy to ${e} out of 5`}
                    className={`text-3xl transition-all ${log.energy >= e ? 'opacity-100' : 'opacity-30'}`}
                  >
                    ⚡
                  </button>
                ))}
              </div>
              <p className="text-center text-gray-400 mt-2">{log.energy}/5</p>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="font-display text-lg font-semibold mb-4">📝 Today&apos;s Notes</h3>
            <textarea 
              value={log.notes || ''} 
              onChange={(e) => setLog({...log, notes: e.target.value})} 
              placeholder="How are you feeling today? Any wins or challenges?" 
              rows={4} 
            />
          </div>

          <button onClick={saveLog} disabled={saving} className="btn-primary w-full py-4">
            {saving ? 'Saving...' : '💾 Save Today\'s Log'}
          </button>
        </div>
      </main>
    </div>
  )

  return <RequireAuth>{content}</RequireAuth>
}
