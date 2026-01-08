'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

const navItems = [
  { id: 'dashboard', path: '/dashboard', icon: '📊', label: 'Dashboard', requiresAuth: true },
  { id: 'workouts', path: '/workouts', icon: '🏋️', label: 'Workouts', requiresAuth: true },
  { id: 'measurements', path: '/measurements', icon: '📏', label: 'Measurements', requiresAuth: true },
  { id: 'daily', path: '/daily', icon: '☀️', label: 'Daily Log', requiresAuth: true },
  { id: 'goals', path: '/goals', icon: '🎯', label: 'Goals', requiresAuth: true },
  { id: 'sobriety', path: '/sobriety', icon: '🌟', label: 'Sobriety', requiresAuth: true },
  { id: 'travel', path: '/travel', icon: '✈️', label: 'Travel', requiresAuth: false },
  { id: 'recipes', path: '/recipes', icon: '🍳', label: 'Recipes', requiresAuth: false },
  { id: 'blog', path: '/blog', icon: '📝', label: 'Blog', requiresAuth: false },
  { id: 'gallery', path: '/gallery', icon: '📸', label: 'Gallery', requiresAuth: false },
  { id: 'science', path: '/science', icon: '🔬', label: 'Science', requiresAuth: false },
  { id: 'merch', path: '/merch', icon: '🛍️', label: 'Merch', requiresAuth: false },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const { user, signOut, isAuthenticated } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const visibleItems = isAuthenticated ? navItems : navItems.filter(item => !item.requiresAuth)

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-dark-card to-dark-bg border-r border-white/5 transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-[72px]'}`}>
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-3xl animate-pulse-slow">💪</span>
          {isOpen && <span className="font-display text-2xl font-bold gradient-text">GHUB</span>}
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="w-7 h-7 rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center">
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
        {visibleItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link key={item.id} href={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'gradient-bg text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="text-xl w-6 text-center">{item.icon}</span>
              {isOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5">
        {isAuthenticated ? (
          <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-success text-success hover:bg-success/10 transition-colors">
            <span>🔓</span>
            {isOpen && <span>Sign Out</span>}
          </button>
        ) : (
          <Link href="/login" className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-white/10 text-gray-400 hover:border-primary hover:text-primary transition-colors">
            <span>🔐</span>
            {isOpen && <span>Admin Login</span>}
          </Link>
        )}
      </div>
    </aside>
  )
}
