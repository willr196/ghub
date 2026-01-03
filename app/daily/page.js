'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

export default function DailyPage() {
  const { user } = useAuth()
  const [log, setLog] = useState({ water_intake: 0, sleep_hours: 7, sleep_quality: 3, mood: 'okay', energy: 3, notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { if (user) fetchLog() }, [user])

  const fetchLog = async () => {
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('date', today).single()
    if (data) setLog(data)
    setLoading(false)
  }

  const saveLog = async () => {
    setSaving(true)
    const { data: existing } = await supabase.from('daily_logs').select('id').eq('user_id', user.id).eq('date', today).single()
    if (existing) {
      await supabase.from('daily_logs').update(log).eq('id', existing.id)
    } else {
      await supabase.from('daily_logs').insert([{ ...log, user_id: user.id, date: today }])
    }
    setSaving(false)
  }

  const moods = [{ emoji: '😢', value: 'sad' }, { emoji: '😕', value: 'meh' }, { emoji: '😐', value: 'okay' }, { emoji: '🙂', value: 'good' }, { emoji: '😄', value: 'great' }]

  if (loading) return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 ml-64 p-8 flex items-center justify-center"><div className="spinner" /></main></div>

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto animate-fadeIn space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">☀️ Daily Wellness Log</h1>
            <p className="text-gray-400 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Water Tracker */}
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">💧 Water Intake</h3>
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(8)].map((_, i) => (
                  <button key={i} onClick={() => setLog({...log, water_intake: i + 1})} className={`text-3xl transition-all ${i < log.water_intake ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-50'}`}>💧</button>
                ))}
              </div>
              <p className="text-center text-gray-400">{log.water_intake} of 8 glasses</p>
            </div>

            {/* Sleep Tracker */}
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">😴 Sleep Tracker</h3>
              <div className="text-center mb-4">
                <input type="number" value={log.sleep_hours} onChange={(e) => setLog({...log, sleep_hours: parseFloat(e.target.value)})} step="0.5" min="0" max="24" className="w-24 text-center text-4xl font-display font-bold bg-transparent border-b-2 border-accent" />
                <span className="text-gray-400 ml-2">hours</span>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-400 block mb-2">Quality</span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(q => (
                    <button key={q} onClick={() => setLog({...log, sleep_quality: q})} className={`text-2xl ${log.sleep_quality >= q ? 'opacity-100' : 'opacity-30'}`}>⭐</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mood Tracker */}
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">🌈 Mood</h3>
              <div className="flex justify-center gap-4">
                {moods.map(m => (
                  <button key={m.value} onClick={() => setLog({...log, mood: m.value})} className={`text-4xl transition-all ${log.mood === m.value ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}>{m.emoji}</button>
                ))}
              </div>
            </div>

            {/* Energy Tracker */}
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">⚡ Energy Level</h3>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(e => (
                  <button key={e} onClick={() => setLog({...log, energy: e})} className={`text-3xl transition-all ${log.energy >= e ? 'opacity-100' : 'opacity-30'}`}>⚡</button>
                ))}
              </div>
              <p className="text-center text-gray-400 mt-2">{log.energy}/5</p>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="font-display text-lg font-semibold mb-4">📝 Today's Notes</h3>
            <textarea value={log.notes || ''} onChange={(e) => setLog({...log, notes: e.target.value})} placeholder="How are you feeling today? Any wins or challenges?" rows={4} />
          </div>

          <button onClick={saveLog} disabled={saving} className="btn-primary w-full py-4">
            {saving ? 'Saving...' : '💾 Save Today\'s Log'}
          </button>
        </div>
      </main>
    </div>
  )
}
