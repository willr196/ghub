'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [dailyLogExists, setDailyLogExists] = useState(false)
  const [sobriety, setSobriety] = useState({ alcoholDays: 0, smokeDays: 0 })
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [hasAnyWorkout, setHasAnyWorkout] = useState(false)
  const [goals, setGoals] = useState([])
  const [hasAnyGoal, setHasAnyGoal] = useState(false)
  const [weeklyStats, setWeeklyStats] = useState({
    thisWeekCount: 0,
    lastWeekCount: 0,
    thisWeekDuration: 0,
    lastWeekDuration: 0,
    thisWeekCalories: 0,
    lastWeekCalories: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [onboardingState, setOnboardingState] = useState({ completed: false, hideUntil: null, loaded: false })
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      // Get start of this week (Sunday)
      const now = new Date()
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek)
      startOfWeek.setHours(0, 0, 0, 0)
      const lastWeekStart = new Date(startOfWeek)
      lastWeekStart.setDate(startOfWeek.getDate() - 7)
      const lastWeekEnd = new Date(startOfWeek)

      // Fetch workouts from this week
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (workoutsError) throw workoutsError
      if (workouts) setRecentWorkouts(workouts)

      const thisWeekDuration = (workouts || []).reduce((sum, w) => sum + (w.duration || 0), 0)
      const thisWeekCalories = (workouts || []).reduce((sum, w) => sum + (w.calories || 0), 0)
      const thisWeekCount = (workouts || []).length

      const { data: anyWorkout, error: anyWorkoutError } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (anyWorkoutError) throw anyWorkoutError
      setHasAnyWorkout((anyWorkout || []).length > 0)

      const { data: lastWeekWorkouts, error: lastWeekError } = await supabase
        .from('workouts')
        .select('duration, calories')
        .eq('user_id', user.id)
        .gte('date', lastWeekStart.toISOString().split('T')[0])
        .lt('date', lastWeekEnd.toISOString().split('T')[0])

      if (lastWeekError) throw lastWeekError

      const lastWeekDuration = (lastWeekWorkouts || []).reduce((sum, w) => sum + (w.duration || 0), 0)
      const lastWeekCalories = (lastWeekWorkouts || []).reduce((sum, w) => sum + (w.calories || 0), 0)
      const lastWeekCount = (lastWeekWorkouts || []).length

      setWeeklyStats({
        thisWeekCount,
        lastWeekCount,
        thisWeekDuration,
        lastWeekDuration,
        thisWeekCalories,
        lastWeekCalories
      })

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
      if (log) {
        setDailyLog(log)
        setDailyLogExists(true)
      } else {
        setDailyLogExists(false)
      }

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .limit(3)
      
      if (goalsError) throw goalsError
      if (goalsData) setGoals(goalsData)

      const { data: anyGoal, error: anyGoalError } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (anyGoalError) throw anyGoalError
      setHasAnyGoal((anyGoal || []).length > 0)

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
  }, [user])

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)])
    if (user) fetchDashboardData()
  }, [user, fetchDashboardData])

  useEffect(() => {
    if (!user || !supabase) return
    const fetchOnboardingState = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_hide_until')
          .eq('id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

        if (fetchError?.code === 'PGRST116') {
          console.warn('Profile row missing, attempting fallback create.')
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              onboarding_completed: false,
              onboarding_hide_until: null,
              updated_at: new Date().toISOString()
            })

          if (upsertError) throw upsertError
        }

        setOnboardingState({
          completed: Boolean(data?.onboarding_completed),
          hideUntil: data?.onboarding_hide_until || null,
          loaded: true
        })
      } catch (e) {
        console.error('Error fetching onboarding state:', e)
        setOnboardingState((prev) => ({ ...prev, loaded: true }))
      }
    }

    fetchOnboardingState()
  }, [user])

  // Compute onboarding steps and completion status
  // These need to be computed before the useEffect that depends on them
  const onboardingSteps = [
    {
      id: 'goal',
      label: 'Set your first goal',
      detail: 'Define a measurable target to train toward.',
      done: hasAnyGoal,
      href: '/goals?onboarding=1'
    },
    {
      id: 'workout',
      label: 'Log your first workout',
      detail: 'Capture today\'s session to start your baseline.',
      done: hasAnyWorkout,
      href: '/workouts?onboarding=1'
    },
    {
      id: 'daily',
      label: 'Complete today\'s wellness log',
      detail: 'Sleep, water, and energy build the recovery signal.',
      done: dailyLogExists,
      href: '/daily?onboarding=1'
    }
  ]

  const onboardingComplete = onboardingSteps.every((step) => step.done)

  // This useEffect MUST come before any early returns
  useEffect(() => {
    if (!user || !supabase) return
    if (!onboardingComplete || onboardingState.completed) return

    const markComplete = async () => {
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true, onboarding_hide_until: null })
          .eq('id', user.id)

        if (updateError) throw updateError
        setOnboardingState((prev) => ({ ...prev, completed: true, hideUntil: null }))
      } catch (e) {
        console.error('Error updating onboarding completion:', e)
      }
    }

    markComplete()
  }, [onboardingComplete, onboardingState.completed, user])

  // Early return for loading state - AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  const handleHideOnboarding = async () => {
    if (!user || !supabase) return
    const threeDays = 3 * 24 * 60 * 60 * 1000
    const hideUntil = new Date(Date.now() + threeDays).toISOString()
    setDismissedOnboarding(true)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_hide_until: hideUntil })
        .eq('id', user.id)

      if (updateError) throw updateError
      setOnboardingState((prev) => ({ ...prev, hideUntil }))
    } catch (e) {
      console.error('Error updating onboarding hide state:', e)
    }
  }

  const hideUntilTs = onboardingState.hideUntil ? new Date(onboardingState.hideUntil).getTime() : 0
  const shouldShowOnboarding = !dismissedOnboarding
    && !onboardingComplete
    && !onboardingState.completed
    && (!hideUntilTs || Date.now() > hideUntilTs)

  const renderDelta = (current, previous, unit) => {
    if (!previous) return 'No prior week data'
    const diff = current - previous
    const sign = diff > 0 ? '+' : ''
    return `${sign}${diff} ${unit} vs last week`
  }

  return (
    <div className="space-y-8">
      {shouldShowOnboarding && (
        <div className="card border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Start your first 7 days</h2>
              <p className="text-gray-400 mt-1">
                Build momentum with a goal, a workout, and today&apos;s recovery signal.
              </p>
            </div>
            <button onClick={handleHideOnboarding} className="btn-secondary text-sm">
              Remind me later
            </button>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {onboardingSteps.map((step) => (
              <div key={step.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{step.label}</span>
                  <span className={`text-xs ${step.done ? 'text-success' : 'text-gray-500'}`}>
                    {step.done ? 'Done' : 'Next'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">{step.detail}</p>
                {step.done ? (
                  <span className="text-success text-sm">✓ Completed</span>
                ) : (
                  <Link href={step.href} className="btn-primary text-sm px-4 py-2 inline-flex">
                    Start
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <h1 className="font-display text-4xl font-bold mb-3">Welcome to GHUB 💪</h1>
        <div className="bg-white/5 border-l-4 border-primary rounded-r-lg px-6 py-4 italic text-gray-400">&ldquo;{quote}&rdquo;</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon="🔥" label="Workouts This Week" value={recentWorkouts.length} color="orange" />
        <StatCard icon="💧" label="Water Today" value={`${dailyLog.water_intake || 0}/8`} unit="glasses" color="blue" />
        <StatCard icon="😴" label="Sleep Last Night" value={dailyLog.sleep_hours || '-'} unit="hrs" color="purple" />
        <StatCard icon="⚡" label="Energy Level" value={dailyLog.energy || '-'} unit="/5" color="yellow" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">📈 Weekly Momentum</h3>
          <span className="text-xs text-gray-500">Week over week</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-gray-400">Workouts</p>
            <p className="text-2xl font-display font-bold">{weeklyStats.thisWeekCount}</p>
            <p className="text-xs text-gray-500">{renderDelta(weeklyStats.thisWeekCount, weeklyStats.lastWeekCount, 'sessions')}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-gray-400">Training Minutes</p>
            <p className="text-2xl font-display font-bold">{weeklyStats.thisWeekDuration}</p>
            <p className="text-xs text-gray-500">{renderDelta(weeklyStats.thisWeekDuration, weeklyStats.lastWeekDuration, 'min')}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-gray-400">Calories Burned</p>
            <p className="text-2xl font-display font-bold">{weeklyStats.thisWeekCalories}</p>
            <p className="text-xs text-gray-500">{renderDelta(weeklyStats.thisWeekCalories, weeklyStats.lastWeekCalories, 'kcal')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display text-lg font-semibold mb-4">🏆 Current Streaks</h3>
          <div className="flex gap-8">
            <div className="text-center">
              <span className="block text-5xl font-display font-bold gradient-text">{sobriety.alcoholDays || 0}</span>
              <span className="text-gray-400 text-sm">Days Alcohol Free</span>
            </div>
            <div className="text-center">
              <span className="block text-5xl font-display font-bold gradient-text">{sobriety.smokeDays || 0}</span>
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