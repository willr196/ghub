'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', target: '', current: 0, unit: '', category: 'Fitness' })

  useEffect(() => { if (user) fetchGoals() }, [user])

  const fetchGoals = async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setGoals(data || [])
      setError(null)
    } catch (e) {
      console.error('Error fetching goals:', e)
      setError('Failed to load goals. Please try again.')
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
        .from('goals')
        .insert([{ 
          ...formData, 
          target: parseFloat(formData.target), 
          user_id: user.id 
        }])
      
      if (insertError) throw insertError
      
      await fetchGoals()
      setShowForm(false)
      setFormData({ name: '', target: '', current: 0, unit: '', category: 'Fitness' })
    } catch (e) {
      console.error('Error creating goal:', e)
      setError('Failed to create goal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateProgress = async (id, current, target) => {
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    try {
      const newCurrent = Math.min(current + 1, target)
      const { error: updateError } = await supabase
        .from('goals')
        .update({ current: newCurrent, completed: newCurrent >= target })
        .eq('id', id)
      
      if (updateError) throw updateError
      await fetchGoals()
    } catch (e) {
      console.error('Error updating goal:', e)
      setError('Failed to update goal. Please try again.')
    }
  }

  const deleteGoal = async (id) => {
    if (!confirm('Delete this goal?')) return
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    try {
      const { error: deleteError } = await supabase.from('goals').delete().eq('id', id)
      if (deleteError) throw deleteError
      await fetchGoals()
    } catch (e) {
      console.error('Error deleting goal:', e)
      setError('Failed to delete goal. Please try again.')
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

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto animate-fadeIn space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold">🎯 Goals & Milestones</h1>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancel' : '+ New Goal'}
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
              <h3 className="font-display text-lg font-semibold">Create New Goal</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Goal Name</label>
                  <input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g., Run 5K" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Fitness</option>
                    <option>Nutrition</option>
                    <option>Wellness</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Target</label>
                  <input 
                    type="number" 
                    value={formData.target} 
                    onChange={(e) => setFormData({...formData, target: e.target.value})} 
                    placeholder="e.g., 5" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Unit</label>
                  <input 
                    value={formData.unit} 
                    onChange={(e) => setFormData({...formData, unit: e.target.value})} 
                    placeholder="e.g., km, sessions, glasses" 
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal) => {
              // Safely calculate progress - handle zero/null targets
              const current = goal.current || 0
              const target = goal.target || 1
              const progress = Math.min(Math.round((current / target) * 100), 100)
              const circumference = 2 * Math.PI * 45
              const offset = circumference - (progress / 100) * circumference
              return (
                <div key={goal.id} className="card text-center">
                  <h3 className="font-semibold mb-4">{goal.name}</h3>
                  <svg width="120" height="120" className="mx-auto mb-4">
                    <circle cx="60" cy="60" r="45" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="45" 
                      fill="transparent" 
                      stroke="url(#gradient)" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      style={{ 
                        strokeDasharray: circumference, 
                        strokeDashoffset: offset, 
                        transform: 'rotate(-90deg)', 
                        transformOrigin: 'center' 
                      }} 
                    />
                    <defs>
                      <linearGradient id="gradient">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                    <text 
                      x="60" 
                      y="65" 
                      textAnchor="middle" 
                      fill="white" 
                      className="text-2xl font-bold" 
                      style={{ fontFamily: 'Space Grotesk' }}
                    >
                      {progress}%
                    </text>
                  </svg>
                  <p className="text-gray-400 mb-4">{goal.current} / {goal.target} {goal.unit}</p>
                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={() => updateProgress(goal.id, goal.current, goal.target)} 
                      className="btn-primary text-sm py-2"
                    >
                      +1
                    </button>
                    <button 
                      onClick={() => deleteGoal(goal.id)} 
                      className="btn-secondary text-sm py-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {activeGoals.length === 0 && (
            <div className="card text-center py-8">
              <span className="text-4xl block mb-4">🎯</span>
              <p className="text-gray-400">No active goals yet. Create your first goal above!</p>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">✅ Completed Goals</h3>
              <div className="space-y-2">
                {completedGoals.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                    <span className="text-success">✓ {g.name}</span>
                    <span className="text-gray-400">{g.target} {g.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
