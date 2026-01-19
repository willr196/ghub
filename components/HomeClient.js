'use client'

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function HomeClient() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          {/* Header */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <span className="text-4xl">💪</span>
              <span className="font-display text-3xl font-bold gradient-text">GHUB</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard" className="btn-primary">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn-primary">
                    Start Tracking
                  </Link>
                  <Link href="/login" className="btn-secondary">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
              Everything you track
              <span className="block gradient-text">to get stronger</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Log workouts, goals, sobriety milestones, and daily wellness in one private hub built for real progress.
            </p>
            
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
                Open Dashboard →
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center gap-4">
                  <Link href="/register" className="btn-primary text-lg px-8 py-4">
                    Start Tracking
                  </Link>
                  <Link href="/login" className="btn-secondary text-lg px-8 py-4">
                    Sign In
                  </Link>
                </div>
                <p className="text-sm text-gray-500">
                  Invite-only access. Have a code? Create your account.
                </p>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-24">
            {[
              { icon: '🏋️', title: 'Workout Tracking', desc: 'Log every rep, track progress over time' },
              { icon: '🌟', title: 'Sobriety Milestones', desc: 'Celebrate health benefits as you heal' },
              { icon: '📊', title: 'Daily Wellness', desc: 'Water, sleep, mood, and energy tracking' },
              { icon: '🎯', title: 'Goal Setting', desc: 'Set targets and watch yourself achieve them' },
              { icon: '📸', title: 'Progress Gallery', desc: 'Visual documentation of your journey' },
              { icon: '🍳', title: 'Healthy Recipes', desc: 'Fuel your body with nutritious meals' },
            ].map((feature, i) => (
              <div key={i} className="card text-center group cursor-default">
                <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </span>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="bg-dark-card/50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <blockquote className="text-2xl md:text-3xl font-light text-gray-300 italic">
            &ldquo;The only bad workout is the one that didn&apos;t happen.&rdquo;
          </blockquote>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 text-center text-gray-500">
        <p>Made with ❤️ for your wellness journey</p>
      </footer>
    </main>
  )
}
