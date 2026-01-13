'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '', excerpt: '', is_public: true })

  const fetchPosts = useCallback(async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      // Show public posts + user's own posts if logged in
      if (user) {
        query = query.or(`is_public.eq.true,user_id.eq.${user.id}`)
      } else {
        query = query.eq('is_public', true)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setPosts(data || [])
      setError(null)
    } catch (e) {
      console.error('Error fetching posts:', e)
      setError('Failed to load blog posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supabase || !user) {
      setError('You must be logged in to write posts')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingId) {
        // Update existing post
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt,
            is_public: formData.is_public,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (updateError) throw updateError
      } else {
        // Insert new post
        const { error: insertError } = await supabase
          .from('blog_posts')
          .insert([{
            ...formData,
            user_id: user.id,
            published_at: new Date().toISOString()
          }])

        if (insertError) throw insertError
      }

      await fetchPosts()
      setShowForm(false)
      setEditingId(null)
      setFormData({ title: '', content: '', excerpt: '', is_public: true })
    } catch (e) {
      console.error('Error saving post:', e)
      setError('Failed to save post. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (post) => {
    setEditingId(post.id)
    setFormData({
      title: post.title,
      content: post.content || '',
      excerpt: post.excerpt || '',
      is_public: post.is_public
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchPosts()
    } catch (e) {
      console.error('Error deleting post:', e)
      setError('Failed to delete post. Please try again.')
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
              <button
                onClick={() => {
                  setShowForm(!showForm)
                  setEditingId(null)
                  setFormData({ title: '', content: '', excerpt: '', is_public: true })
                }}
                className="btn-primary"
              >
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
              <h3 className="font-display text-lg font-semibold">{editingId ? 'Edit Post' : 'Write New Post'}</h3>
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
                {saving ? 'Saving...' : editingId ? 'Update Post' : 'Publish Post'}
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
                  {user && post.user_id === user.id && (
                    <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
                      <button
                        onClick={() => handleEdit(post)}
                        className="btn-secondary text-sm"
                      >
                        ✏️ Edit Post
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="btn-secondary text-sm text-error"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
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
