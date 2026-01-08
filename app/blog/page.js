'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

export default function BlogPage() {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ title: '', content: '', excerpt: '', is_public: true })

  useEffect(() => { fetchPosts() }, [user])

  const fetchPosts = async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setPosts(data || [])
      setError(null)
    } catch (e) {
      console.error('Error fetching posts:', e)
      setError('Failed to load blog posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supabase || !user) {
      setError('You must be logged in to write posts')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert([{ 
          ...formData, 
          user_id: user.id, 
          published_at: new Date().toISOString() 
        }])
      
      if (insertError) throw insertError
      
      await fetchPosts()
      setShowForm(false)
      setFormData({ title: '', content: '', excerpt: '', is_public: true })
    } catch (e) {
      console.error('Error publishing post:', e)
      setError('Failed to publish post. Please try again.')
    } finally {
      setSaving(false)
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

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-3xl mx-auto animate-fadeIn space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">📝 Fitness Journey Blog</h1>
              <p className="text-gray-400 mt-1">Reflections, wins, and lessons learned</p>
            </div>
            {isAuthenticated && (
              <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                {showForm ? 'Cancel' : '+ Write Post'}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
              {error}
              <button onClick={() => setError(null)} className="ml-4 text-error/70 hover:text-error">✕</button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <h3 className="font-display text-lg font-semibold">Write New Post</h3>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Post title" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Excerpt (short preview)</label>
                <input 
                  value={formData.excerpt} 
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})} 
                  placeholder="Brief summary..." 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Content</label>
                <textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({...formData, content: e.target.value})} 
                  placeholder="Share your thoughts..." 
                  rows={8} 
                  required 
                />
              </div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={formData.is_public} 
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})} 
                  className="w-4 h-4" 
                />
                <span className="text-sm text-gray-400">Make this post public</span>
              </label>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Publishing...' : 'Publish Post'}
              </button>
            </form>
          )}

          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="card">
                  <h2 className="font-display text-2xl font-bold mb-2">{post.title}</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {post.excerpt && (
                    <p className="text-gray-400 mb-4">{post.excerpt}</p>
                  )}
                  <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                    {post.content}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <span className="text-4xl block mb-4">📝</span>
              <p className="text-gray-400">
                No blog posts yet. {isAuthenticated ? 'Write your first post above!' : 'Check back soon!'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
