'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/blog', label: 'Blog' },
  { path: '/recipes', label: 'Recipes' },
  { path: '/science', label: 'Science' },
  { path: '/merch', label: 'Merch' },
]

export default function PublicLayout({ children }) {
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user)
    }
    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Navigation */}
      <nav className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">💪</span>
            <span className="font-space text-2xl font-bold gradient-text">GHUB</span>
          </Link>
          
          <div className="flex items-center gap-6">
            {navItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className={`transition-colors ${
                  pathname === item.path 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <Link href="/dashboard" className="btn-primary text-sm">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth" className="btn-primary text-sm">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main 
        className="min-h-[calc(100vh-73px)]"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(37, 99, 235, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.05) 0%, transparent 50%)'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500">
          <p>Made with ❤️ for your wellness journey</p>
        </div>
      </footer>
    </div>
  )
}
