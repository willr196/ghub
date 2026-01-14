'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Smoothies']

export default function RecipesPage() {
  const { user, isAuthenticated } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Breakfast',
    description: '',
    ingredients: '',
    instructions: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    prep_time: '',
    cook_time: '',
    is_public: true
  })

  const fetchRecipes = useCallback(async () => {
    if (!supabase) {
      setError('Database connection not available')
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })

      // Show public recipes + user's own recipes if logged in
      if (user) {
        query = query.or(`is_public.eq.true,user_id.eq.${user.id}`)
      } else {
        query = query.eq('is_public', true)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setRecipes(data || [])
      setError(null)
    } catch (e) {
      console.error('Error fetching recipes:', e)
      setError('Failed to load recipes. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supabase || !user) {
      setError('You must be logged in to add recipes')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Safely parse ingredients - split by newline, trim, filter empty, store as array
      const ingredientsArray = formData.ingredients
        ? formData.ingredients.split('\n')
            .map(i => i.trim())
            .filter(i => i.length > 0)
        : null

      const recipeData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        ingredients: ingredientsArray,
        instructions: formData.instructions,
        calories: parseInt(formData.calories) || null,
        protein: parseInt(formData.protein) || null,
        carbs: parseInt(formData.carbs) || null,
        fat: parseInt(formData.fat) || null,
        prep_time: parseInt(formData.prep_time) || null,
        cook_time: parseInt(formData.cook_time) || null,
        is_public: formData.is_public,
        user_id: user.id
      }

      if (editingId) {
        // Update existing
        const { error: updateError } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', editingId)

        if (updateError) throw updateError
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('recipes')
          .insert([recipeData])

        if (insertError) throw insertError
      }

      await fetchRecipes()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: '',
        category: 'Breakfast',
        description: '',
        ingredients: '',
        instructions: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        prep_time: '',
        cook_time: '',
        is_public: true
      })
    } catch (e) {
      console.error('Error saving recipe:', e)
      setError('Failed to save recipe. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (recipe) => {
    setEditingId(recipe.id)
    // Safely handle ingredients - check if it's an array before joining
    const ingredientsText = recipe.ingredients && Array.isArray(recipe.ingredients)
      ? recipe.ingredients.join('\n')
      : ''

    setFormData({
      name: recipe.name,
      category: recipe.category || 'Breakfast',
      description: recipe.description || '',
      ingredients: ingredientsText,
      instructions: recipe.instructions || '',
      calories: recipe.calories || '',
      protein: recipe.protein || '',
      carbs: recipe.carbs || '',
      fat: recipe.fat || '',
      prep_time: recipe.prep_time || '',
      cook_time: recipe.cook_time || '',
      is_public: recipe.is_public
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this recipe?')) return
    if (!supabase) {
      setError('Database connection not available')
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchRecipes()
    } catch (e) {
      console.error('Error deleting recipe:', e)
      setError('Failed to delete recipe. Please try again.')
    }
  }

  const filteredRecipes = filter === 'All' ? recipes : recipes.filter(r => r.category === filter)
  const icons = {
    Breakfast: '🥣',
    Lunch: '🥗',
    Dinner: '🍽️',
    Snacks: '🥜',
    Smoothies: '🥤'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 flex items-center justify-center">
          <div className="spinner" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold">🍳 Healthy Recipes</h1>
            {isAuthenticated && (
              <button
                onClick={() => {
                  setShowForm(!showForm)
                  setEditingId(null)
                  setFormData({
                    name: '',
                    category: 'Breakfast',
                    description: '',
                    ingredients: '',
                    instructions: '',
                    calories: '',
                    protein: '',
                    carbs: '',
                    fat: '',
                    prep_time: '',
                    cook_time: '',
                    is_public: true
                  })
                }}
                className="btn-primary"
              >
                {showForm ? 'Cancel' : '+ Add Recipe'}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
              {error}
              <button onClick={() => setError(null)} className="ml-4 text-error/70 hover:text-error">✕</button>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filter === c
                    ? 'gradient-bg text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <h3 className="font-display text-lg font-semibold">
                {editingId ? 'Edit Recipe' : 'Add New Recipe'}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Recipe Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Calories</label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({...formData, calories: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={formData.protein}
                    onChange={(e) => setFormData({...formData, protein: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={formData.carbs}
                    onChange={(e) => setFormData({...formData, carbs: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={formData.fat}
                    onChange={(e) => setFormData({...formData, fat: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prep Time (min)</label>
                  <input
                    type="number"
                    value={formData.prep_time}
                    onChange={(e) => setFormData({...formData, prep_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cook Time (min)</label>
                  <input
                    type="number"
                    value={formData.cook_time}
                    onChange={(e) => setFormData({...formData, cook_time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ingredients (one per line)</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                  placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  rows={6}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-400">Make this recipe public</span>
              </label>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editingId ? 'Update Recipe' : 'Save Recipe'}
              </button>
            </form>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="card overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setSelectedRecipe(recipe)}>
                <div className="h-32 flex items-center justify-center text-6xl bg-gradient-to-br from-primary/20 to-accent/20 -mx-6 -mt-6 mb-4">
                  {icons[recipe.category] || '🍽️'}
                </div>
                <span className="text-xs text-accent uppercase tracking-wider">{recipe.category}</span>
                <h3 className="font-display text-lg font-semibold mt-1">{recipe.name}</h3>
                <p className="text-gray-400 text-sm mt-2 line-clamp-2">{recipe.description}</p>
                <div className="flex gap-4 mt-4 text-sm text-gray-400 flex-wrap">
                  {recipe.calories > 0 && <span>🔥 {recipe.calories} kcal</span>}
                  {recipe.protein > 0 && <span>💪 {recipe.protein}g</span>}
                  {(recipe.prep_time > 0 || recipe.cook_time > 0) && (
                    <span>⏱️ {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                  )}
                </div>
                {user && recipe.user_id === user.id && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(recipe); }}
                      className="btn-secondary text-sm flex-1"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                      className="btn-secondary text-sm text-error"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="card text-center py-12">
              <span className="text-4xl block mb-4">🍳</span>
              <p className="text-gray-400">No recipes found</p>
            </div>
          )}
        </div>
      </main>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-dark-card rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs text-accent uppercase tracking-wider">{selectedRecipe.category}</span>
                <h2 className="font-display text-3xl font-bold mt-1">{selectedRecipe.name}</h2>
                {selectedRecipe.description && (
                  <p className="text-gray-400 mt-2">{selectedRecipe.description}</p>
                )}
              </div>
              <button onClick={() => setSelectedRecipe(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {selectedRecipe.calories > 0 && (
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <span className="block text-2xl mb-1">🔥</span>
                  <span className="block font-bold">{selectedRecipe.calories}</span>
                  <span className="text-xs text-gray-400">Calories</span>
                </div>
              )}
              {selectedRecipe.protein > 0 && (
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <span className="block text-2xl mb-1">💪</span>
                  <span className="block font-bold">{selectedRecipe.protein}g</span>
                  <span className="text-xs text-gray-400">Protein</span>
                </div>
              )}
              {selectedRecipe.carbs > 0 && (
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <span className="block text-2xl mb-1">🌾</span>
                  <span className="block font-bold">{selectedRecipe.carbs}g</span>
                  <span className="text-xs text-gray-400">Carbs</span>
                </div>
              )}
              {selectedRecipe.fat > 0 && (
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <span className="block text-2xl mb-1">🥑</span>
                  <span className="block font-bold">{selectedRecipe.fat}g</span>
                  <span className="text-xs text-gray-400">Fat</span>
                </div>
              )}
            </div>

            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
              <div className="mb-6">
                <h3 className="font-display text-xl font-semibold mb-3">📝 Ingredients</h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecipe.instructions && (
              <div>
                <h3 className="font-display text-xl font-semibold mb-3">👨‍🍳 Instructions</h3>
                <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">{selectedRecipe.instructions}</p>
              </div>
            )}

            {(selectedRecipe.prep_time > 0 || selectedRecipe.cook_time > 0) && (
              <div className="mt-6 pt-6 border-t border-white/10 flex gap-6">
                {selectedRecipe.prep_time > 0 && (
                  <div>
                    <span className="text-gray-400 text-sm">Prep Time: </span>
                    <span className="font-semibold">{selectedRecipe.prep_time} min</span>
                  </div>
                )}
                {selectedRecipe.cook_time > 0 && (
                  <div>
                    <span className="text-gray-400 text-sm">Cook Time: </span>
                    <span className="font-semibold">{selectedRecipe.cook_time} min</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
