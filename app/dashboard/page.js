'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

const quotes = [
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Don't wish for it. Work for it.",
  "Success starts with self-discipline.",
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [quote, setQuote] = useState('')
  const [dailyLog, setDailyLog] = useState({ water_intake: 0, sleep_hours: 0, mood: '', energy: 0 })
  const [sobriety, setSobriety] = useState({ alcoholDays: 0, smokeDays: 0 })
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)])
    if (user) fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      // Fetch workouts
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5)
      
      if (workoutsError) throw workoutsError
      if (workouts) setRecentWorkouts(workouts)

      // Fetch today's log
      const today = new Date().toISOString().split('T')[0]
      const { data: log, error: logError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      
      // single() throws error if no row found, which is okay
      if (logError && logError.code !== 'PGRST116') throw logError
      if (log) setDailyLog(log)

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .limit(3)
      
      if (goalsError) throw goalsError
      if (goalsData) setGoals(goalsData)

      // Fetch sobriety data
      const { data: sobrietyData, error: sobrietyError } = await supabase
        .from('sobriety')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (sobrietyError) throw sobrietyError
      if (sobrietyData) {
        const alcohol = sobrietyData.find(s => s.type === 'alcohol')
        const smoking = sobrietyData.find(s => s.type === 'smoking')
        const calcDays = (d) => d ? Math.floor((new Date() - new Date(d)) / 86400000) : 0
        setSobriety({ alcoholDays: calcDays(alcohol?.start_date), smokeDays: calcDays(smoking?.start_date) })
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e)
      setError('Failed to load some dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <h1 className="font-display text-4xl font-bold mb-3">Welcome to GHUB 💪</h1>
        <div className="bg-white/5 border-l-4 border-primary rounded-r-lg px-6 py-4 italic text-gray-400">"{quote}"</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon="🔥" label="Workouts This Week" value={recentWorkouts.length} color="orange" />
        <StatCard icon="💧" label="Water Today" value={`${dailyLog.water_intake || 0}/8`} unit="glasses" color="blue" />
        <StatCard icon="😴" label="Sleep Last Night" value={dailyLog.sleep_hours || '-'} unit="hrs" color="purple" />
        <StatCard icon="⚡" label="Energy Level" value={dailyLog.energy || '-'} unit="/5" color="yellow" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display text-lg font-semibold mb-4">🏆 Current Streaks</h3>
          <div className="flex gap-8">
            <div className="text-center">
              <span className="block text-5xl font-display font-bold gradient-text">{sobriety.alcoholDays}</span>
              <span className="text-gray-400 text-sm">Days Alcohol Free</span>
            </div>
            <div className="text-center">
              <span className="block text-5xl font-display font-bold gradient-text">{sobriety.smokeDays}</span>
              <span className="text-gray-400 text-sm">Days Smoke Free</span>
            </div>
          </div>
          <Link href="/sobriety" className="btn-secondary w-full mt-4 text-center block">View Milestones →</Link>
        </div>

        <div className="card">
          <h3 className="font-display text-lg font-semibold mb-4">🎯 Goals Progress</h3>
          {goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between text-sm"><span>{goal.name}</span><span className="text-gray-400">{goal.current}/{goal.target} {goal.unit}</span></div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-4">No active goals yet</p>}
          <Link href="/goals" className="btn-secondary w-full mt-4 text-center block">Manage Goals →</Link>
        </div>

        <div className="card">
          <h3 className="font-display text-lg font-semibold mb-4">💪 Recent Workouts</h3>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.slice(0, 3).map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div><span className="font-medium">{w.name}</span><span className="ml-2 text-xs px-2 py-1 bg-primary/20 text-primary-light rounded">{w.type}</span></div>
                  <div className="text-sm text-gray-400 space-x-4"><span>⏱️ {w.duration} min</span><span>🔥 {w.calories} kcal</span></div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-4">No workouts logged yet</p>}
          <Link href="/workouts" className="btn-secondary w-full mt-4 text-center block">View All Workouts →</Link>
        </div>

        <div className="card">
          <h3 className="font-display text-lg font-semibold mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[{ href: '/workouts', icon: '🏋️', label: 'Log Workout' }, { href: '/daily', icon: '☀️', label: 'Daily Check-in' }, { href: '/measurements', icon: '📏', label: 'Update Weight' }, { href: '/blog', icon: '📝', label: 'Write Post' }].map((a) => (
              <Link key={a.href} href={a.href} className="p-4 bg-white/5 rounded-lg text-center hover:bg-white/10 transition-colors">
                <span className="text-2xl block mb-2">{a.icon}</span><span className="text-sm">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit, color }) {
  return (
    <div className={`card flex items-center gap-4 stat-${color}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-display text-2xl font-bold">{value}{unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  )
}
