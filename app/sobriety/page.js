'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import RequireAuth from '@/components/RequireAuth'
import Sidebar from '@/components/Sidebar'

const alcoholBenefits = [
  { day: 1, benefit: 'Blood sugar normalizes' },
  { day: 3, benefit: 'Body begins detoxification' },
  { day: 7, benefit: 'Sleep quality improves' },
  { day: 14, benefit: 'Skin begins to look healthier' },
  { day: 30, benefit: 'Liver fat reduces by up to 15%' },
  { day: 60, benefit: 'Brain fog clears significantly' },
  { day: 90, benefit: 'Mental clarity and energy increase' },
  { day: 180, benefit: 'Risk of heart disease decreases' },
  { day: 365, benefit: 'Overall mortality risk significantly reduced' },
]

const smokingBenefits = [
  { day: 1, benefit: 'Heart rate drops to normal' },
  { day: 2, benefit: 'Nerve endings start regenerating' },
  { day: 3, benefit: 'Nicotine leaves your body' },
  { day: 14, benefit: 'Circulation improves' },
  { day: 30, benefit: 'Lung function increases up to 30%' },
  { day: 90, benefit: 'Coughing and shortness of breath decrease' },
  { day: 180, benefit: 'Cilia regrow in lungs' },
  { day: 365, benefit: 'Heart disease risk drops by 50%' },
]

export default function SobrietyPage() {
  const { user } = useAuth()
  const [sobrietyData, setSobrietyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ type: 'alcohol', start_date: new Date().toISOString().split('T')[0] })

  const fetchSobriety = useCallback(async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('sobriety')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (fetchError) throw fetchError
      setSobrietyData(data || [])
      setError(null)
    } catch (e) {
      console.error('Error fetching sobriety data:', e)
      setError('Failed to load sobriety data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { if (user) fetchSobriety() }, [user, fetchSobriety])

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
        .from('sobriety')
        .insert([{ ...formData, user_id: user.id }])
      
      if (insertError) throw insertError
      
      await fetchSobriety()
      setShowForm(false)
    } catch (e) {
      console.error('Error starting tracker:', e)
      setError('Failed to start tracker. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const calcDays = (startDate) => Math.floor((new Date() - new Date(startDate)) / 86400000)

  const getBenefits = (days, type) => {
    const list = type === 'alcohol' ? alcoholBenefits : smokingBenefits
    const achieved = list.filter(b => days >= b.day)
    const next = list.find(b => days < b.day)
    return { achieved, next }
  }

  const alcohol = sobrietyData.find(s => s.type === 'alcohol')
  const smoking = sobrietyData.find(s => s.type === 'smoking')
  const alcoholDays = alcohol ? calcDays(alcohol.start_date) : 0
  const smokingDays = smoking ? calcDays(smoking.start_date) : 0

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
            <div>
              <h1 className="font-display text-3xl font-bold">🌟 Sobriety Tracker</h1>
              <p className="text-gray-400 mt-1">Celebrating every day of your journey</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancel' : '+ Start Tracking'}
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
              <h3 className="font-display text-lg font-semibold">Start a New Tracker</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="alcohol">Alcohol</option>
                    <option value="smoking">Smoking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start Date (Day 1)</label>
                  <input 
                    type="date" 
                    value={formData.start_date} 
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Starting...' : 'Start Tracking'}
              </button>
            </form>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Alcohol Card */}
            <div className="card text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">🍷</span>
                <h3 className="font-display text-xl font-semibold">Alcohol Free</h3>
              </div>
              <div className="mb-6">
                <span className="text-7xl font-display font-bold gradient-text">{alcoholDays}</span>
                <span className="block text-gray-400 mt-2">Days</span>
              </div>
              {alcohol && (
                <div className="text-left">
                  <h4 className="text-sm text-gray-400 mb-3">🏆 Benefits Unlocked</h4>
                  <div className="space-y-2">
                    {getBenefits(alcoholDays, 'alcohol').achieved.slice(-3).map((b, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border-l-2 border-success text-sm">
                        <span className="text-success">✓</span>
                        <span>{b.benefit}</span>
                        <span className="ml-auto text-gray-500">Day {b.day}</span>
                      </div>
                    ))}
                  </div>
                  {getBenefits(alcoholDays, 'alcohol').next && (
                    <div className="mt-4">
                      <h4 className="text-sm text-gray-400 mb-2">🔜 Next Milestone</h4>
                      <div className="p-3 bg-white/5 rounded-lg border-l-2 border-warning text-sm">
                        <span>{getBenefits(alcoholDays, 'alcohol').next.benefit}</span>
                        <span className="block text-gray-500 mt-1">
                          {getBenefits(alcoholDays, 'alcohol').next.day - alcoholDays} days away
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!alcohol && <p className="text-gray-400">Click &quot;Start Tracking&quot; to begin</p>}
            </div>

            {/* Smoking Card */}
            <div className="card text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">🚭</span>
                <h3 className="font-display text-xl font-semibold">Smoke Free</h3>
              </div>
              <div className="mb-6">
                <span className="text-7xl font-display font-bold gradient-text">{smokingDays}</span>
                <span className="block text-gray-400 mt-2">Days</span>
              </div>
              {smoking && (
                <div className="text-left">
                  <h4 className="text-sm text-gray-400 mb-3">🏆 Benefits Unlocked</h4>
                  <div className="space-y-2">
                    {getBenefits(smokingDays, 'smoking').achieved.slice(-3).map((b, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border-l-2 border-success text-sm">
                        <span className="text-success">✓</span>
                        <span>{b.benefit}</span>
                        <span className="ml-auto text-gray-500">Day {b.day}</span>
                      </div>
                    ))}
                  </div>
                  {getBenefits(smokingDays, 'smoking').next && (
                    <div className="mt-4">
                      <h4 className="text-sm text-gray-400 mb-2">🔜 Next Milestone</h4>
                      <div className="p-3 bg-white/5 rounded-lg border-l-2 border-warning text-sm">
                        <span>{getBenefits(smokingDays, 'smoking').next.benefit}</span>
                        <span className="block text-gray-500 mt-1">
                          {getBenefits(smokingDays, 'smoking').next.day - smokingDays} days away
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!smoking && <p className="text-gray-400">Click &quot;Start Tracking&quot; to begin</p>}
            </div>
          </div>

          {/* Health Savings */}
          <div className="card">
            <h3 className="font-display text-lg font-semibold mb-4">💰 Health & Savings Impact</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <span className="text-3xl block mb-2">💵</span>
                <span className="text-2xl font-display font-bold text-success">
                  £{(alcoholDays * 12 + smokingDays * 10).toLocaleString()}
                </span>
                <span className="block text-gray-400 text-sm">Money Saved</span>
              </div>
              <div>
                <span className="text-3xl block mb-2">❤️</span>
                <span className="text-2xl font-display font-bold text-success">
                  {Math.round((smokingDays * 11) / 60)} hrs
                </span>
                <span className="block text-gray-400 text-sm">Life Gained</span>
              </div>
              <div>
                <span className="text-3xl block mb-2">🚬</span>
                <span className="text-2xl font-display font-bold text-success">
                  {smokingDays * 20}
                </span>
                <span className="block text-gray-400 text-sm">Cigarettes Not Smoked</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )

  return <RequireAuth>{content}</RequireAuth>
}
