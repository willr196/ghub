'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

export default function MeasurementsPage() {
  const { user } = useAuth()
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '' })

  useEffect(() => { if (user) fetchMeasurements() }, [user])

  const fetchMeasurements = async () => {
    const { data } = await supabase.from('measurements').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30)
    if (data) setMeasurements(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanData = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== '').map(([k, v]) => [k, parseFloat(v)]))
    await supabase.from('measurements').insert([{ ...cleanData, user_id: user.id, date: new Date().toISOString().split('T')[0] }])
    fetchMeasurements()
    setShowForm(false)
    setFormData({ weight: '', chest: '', waist: '', hips: '', arms: '', thighs: '' })
  }

  const latest = measurements[0] || {}
  const oldest = measurements[measurements.length - 1] || {}
  const weightChange = latest.weight && oldest.weight ? (latest.weight - oldest.weight).toFixed(1) : 0

  if (loading) return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 ml-64 p-8 flex items-center justify-center"><div className="spinner" /></main></div>

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto animate-fadeIn space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold">📏 Body Measurements</h1>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? 'Cancel' : '+ Add Measurements'}</button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <h3 className="font-display text-lg font-semibold">Log New Measurements</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Weight (lbs)</label><input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} placeholder="145" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Chest (in)</label><input type="number" step="0.1" value={formData.chest} onChange={(e) => setFormData({...formData, chest: e.target.value})} placeholder="34" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Waist (in)</label><input type="number" step="0.1" value={formData.waist} onChange={(e) => setFormData({...formData, waist: e.target.value})} placeholder="28" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Hips (in)</label><input type="number" step="0.1" value={formData.hips} onChange={(e) => setFormData({...formData, hips: e.target.value})} placeholder="36" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Arms (in)</label><input type="number" step="0.1" value={formData.arms} onChange={(e) => setFormData({...formData, arms: e.target.value})} placeholder="12" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Thighs (in)</label><input type="number" step="0.1" value={formData.thighs} onChange={(e) => setFormData({...formData, thighs: e.target.value})} placeholder="22" /></div>
              </div>
              <button type="submit" className="btn-primary">Save Measurements</button>
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
              <h3 className="font-display text-lg font-semibold mb-4">Latest Measurements</h3>
              <div className="space-y-3">
                {[{ label: 'Chest', value: latest.chest }, { label: 'Waist', value: latest.waist }, { label: 'Hips', value: latest.hips }, { label: 'Arms', value: latest.arms }, { label: 'Thighs', value: latest.thighs }].map(m => (
                  <div key={m.label} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">{m.label}</span>
                    <span className="font-semibold">{m.value || '--'}"</span>
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
                  const min = Math.min(...measurements.filter(x => x.weight).map(x => x.weight))
                  const max = Math.max(...measurements.filter(x => x.weight).map(x => x.weight))
                  const range = max - min || 1
                  const height = ((m.weight - min) / range) * 100 + 20
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-400">{m.weight}</span>
                      <div className="w-8 gradient-bg rounded-t" style={{ height: `${height}px` }} />
                      <span className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-gray-400 text-center py-8">Add weight measurements to see your progress chart</p>}
          </div>
        </div>
      </main>
    </div>
  )
}
