'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Smoothies']

export default function RecipesPage() {
  const { user, isAuthenticated } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', category: 'Breakfast', description: '', calories: '', protein: '', prep_time: '', instructions: '', is_public: true })

  useEffect(() => { fetchRecipes() }, [user])

  const fetchRecipes = async () => {
    const { data } = await supabase.from('recipes').select('*').eq('is_public', true).order('created_at', { ascending: false })
    if (data) setRecipes(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('recipes').insert([{ ...formData, calories: parseInt(formData.calories) || 0, protein: parseInt(formData.protein) || 0, prep_time: parseInt(formData.prep_time) || 0, user_id: user.id }])
    fetchRecipes()
    setShowForm(false)
  }

  const filteredRecipes = filter === 'All' ? recipes : recipes.filter(r => r.category === filter)
  const icons = { Breakfast: '🥣', Lunch: '🥗', Dinner: '🍽️', Snacks: '🥜', Smoothies: '🥤' }

  if (loading) return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 ml-64 p-8 flex items-center justify-center"><div className="spinner" /></main></div>

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold">🍳 Healthy Recipes</h1>
            {isAuthenticated && <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? 'Cancel' : '+ Add Recipe'}</button>}
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full text-sm transition-colors ${filter === c ? 'gradient-bg text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{c}</button>
            ))}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <h3 className="font-display text-lg font-semibold">Add New Recipe</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Recipe Name</label><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm text-gray-400 mb-1">Calories</label><input type="number" value={formData.calories} onChange={(e) => setFormData({...formData, calories: e.target.value})} /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Protein (g)</label><input type="number" value={formData.protein} onChange={(e) => setFormData({...formData, protein: e.target.value})} /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Prep Time (min)</label><input type="number" value={formData.prep_time} onChange={(e) => setFormData({...formData, prep_time: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Instructions</label><textarea value={formData.instructions} onChange={(e) => setFormData({...formData, instructions: e.target.value})} rows={4} /></div>
              <button type="submit" className="btn-primary">Save Recipe</button>
            </form>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="card overflow-hidden">
                <div className="h-32 flex items-center justify-center text-6xl bg-gradient-to-br from-primary/20 to-accent/20 -mx-6 -mt-6 mb-4">{icons[recipe.category] || '🍽️'}</div>
                <span className="text-xs text-accent uppercase tracking-wider">{recipe.category}</span>
                <h3 className="font-display text-lg font-semibold mt-1">{recipe.name}</h3>
                <p className="text-gray-400 text-sm mt-2">{recipe.description}</p>
                <div className="flex gap-4 mt-4 text-sm text-gray-400">
                  {recipe.calories && <span>🔥 {recipe.calories} kcal</span>}
                  {recipe.protein && <span>💪 {recipe.protein}g</span>}
                  {recipe.prep_time && <span>⏱️ {recipe.prep_time} min</span>}
                </div>
              </div>
            ))}
          </div>
          
          {filteredRecipes.length === 0 && <p className="text-gray-400 text-center py-12">No recipes found</p>}
        </div>
      </main>
    </div>
  )
}
