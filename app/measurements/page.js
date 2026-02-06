'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalDateString } from '@/lib/date'
import { useAuth } from '@/components/AuthProvider'
import RequireAuth from '@/components/RequireAuth'
import Sidebar from '@/components/Sidebar'

export default function MeasurementsPage() {
  const { user } = useAuth()
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '' })

  const fetchMeasurements = useCallback(async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30)
      
      if (fetchError) throw fetchError
      setMeasurements(data || [])
      setError(null)
    } catch (e) {
      console.error('Error fetching measurements:', e)
      setError('Failed to load measurements. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { if (user) fetchMeasurements() }, [user, fetchMeasurements])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Safely parse measurements - validate numbers and filter out NaN
      const cleanData = Object.fromEntries(
        Object.entries(formData)
          .filter(([_, v]) => v !== '')
          .map(([k, v]) => [k, parseFloat(v)])
          .filter(([_, v]) => !isNaN(v))
      )

      if (editingId) {
        // Update existing
        const { error: updateError } = await supabase
          .from('measurements')
          .update(cleanData)
          .eq('id', editingId)

        if (updateError) throw updateError
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('measurements')
          .insert([{ ...cleanData, user_id: user.id, date: getLocalDateString() }])

        if (insertError) throw insertError
      }

      await fetchMeasurements()
      setShowForm(false)
      setEditingId(null)
      setFormData({ weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '' })
    } catch (e) {
      console.error('Error saving measurements:', e)
      setError('Failed to save measurements. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (measurement) => {
    setEditingId(measurement.id)
    setFormData({
      weight: measurement.weight || '',
      chest: measurement.chest || '',
      waist: measurement.waist || '',
      hips: measurement.hips || '',
      arms: measurement.arms || '',
      thighs: measurement.thighs || ''
    })
    setShowForm(true)
  }

  const latest = measurements[0] || {}
  const oldest = measurements[measurements.length - 1] || {}
  const weightChange = latest.weight && oldest.weight ? (latest.weight - oldest.weight).toFixed(1) : 0

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
            <h1 className="font-display text-3xl font-bold">📏 Body Measurements</h1>
            <button
              onClick={() => {
                setShowForm(!showForm)
                setEditingId(null)
                setFormData({ weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '' })
              }}
              className="btn-primary"
            >
              {showForm ? 'Cancel' : '+ Add Measurements'}
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
              <h3 className="font-display text-lg font-semibold">{editingId ? 'Edit Measurements' : 'Log New Measurements'}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Weight (lbs)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.weight} 
                    onChange={(e) => setFormData({...formData, weight: e.target.value})} 
                    placeholder="145" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Chest (in)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.chest} 
                    onChange={(e) => setFormData({...formData, chest: e.target.value})} 
                    placeholder="34" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Waist (in)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.waist} 
                    onChange={(e) => setFormData({...formData, waist: e.target.value})} 
                    placeholder="28" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hips (in)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.hips} 
                    onChange={(e) => setFormData({...formData, hips: e.target.value})} 
                    placeholder="36" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Arms (in)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.arms} 
                    onChange={(e) => setFormData({...formData, arms: e.target.value})} 
                    placeholder="12" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Thighs (in)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.thighs} 
                    onChange={(e) => setFormData({...formData, thighs: e.target.value})} 
                    placeholder="22" 
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editingId ? 'Update Measurements' : 'Save Measurements'}
              </button>
            </form>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card text-center">
              <h3 className="font-display text-lg font-semibold mb-2">Current Weight</h3>
              <span className="text-6xl font-display font-bold gradient-text">{latest.weight || '--'}</span>
              <span className="text-gray-400 ml-2">lbs</span>
              {weightChange !== 0 && (
                <p className={`mt-2 ${weightChange < 0 ? 'text-success' : 'text-warning'}`}>
                  {weightChange > 0 ? '+' : ''}{weightChange} lbs since first entry
                </p>
              )}
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-lg font-semibold">Latest Measurements</h3>
                {latest.id && (
                  <button
                    onClick={() => handleEdit(latest)}
                    className="btn-secondary text-sm"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Chest', value: latest.chest },
                  { label: 'Waist', value: latest.waist },
                  { label: 'Hips', value: latest.hips },
                  { label: 'Arms', value: latest.arms },
                  { label: 'Thighs', value: latest.thighs }
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">{m.label}</span>
                    <span className="font-semibold">{m.value || '--'}&quot;</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-semibold mb-4">Weight History</h3>
            {measurements.filter(m => m.weight).length > 0 ? (
              <div className="flex items-end justify-around h-48 gap-2">
                {measurements.filter(m => m.weight).slice(0, 10).reverse().map((m, i) => {
                  const weights = measurements.filter(x => x.weight).map(x => x.weight)
                  // Safely calculate min/max with fallbacks for edge cases
                  const min = weights.length > 0 ? Math.min(...weights) : 0
                  const max = weights.length > 0 ? Math.max(...weights) : 0
                  const range = max - min || 1
                  const height = ((m.weight - min) / range) * 100 + 20
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-400">{m.weight}</span>
                      <div className="w-8 gradient-bg rounded-t" style={{ height: `${height}px` }} />
                      <span className="text-xs text-gray-500">
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Add weight measurements to see your progress chart
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  return <RequireAuth>{content}</RequireAuth>
}
