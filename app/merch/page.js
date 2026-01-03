'use client'

import Sidebar from '@/components/Sidebar'

const products = [
  { name: 'Resistance Bands Set', category: 'Equipment', price: '£19.99', rating: 4.8, icon: '🏋️', desc: 'Perfect for home workouts and warm-ups. Multiple resistance levels included.' },
  { name: 'Foam Roller', category: 'Recovery', price: '£24.99', rating: 4.9, icon: '🧘', desc: 'Essential for muscle recovery and mobility work. High-density EVA foam.' },
  { name: 'Whey Protein Powder', category: 'Supplements', price: '£39.99', rating: 4.7, icon: '🥤', desc: '25g protein per serving. Great taste, mixes easily.' },
  { name: 'Workout Leggings', category: 'Apparel', price: '£35.00', rating: 4.6, icon: '👖', desc: 'Squat-proof, moisture-wicking fabric. Hidden pocket for phone.' },
  { name: 'Smart Water Bottle', category: 'Accessories', price: '£29.99', rating: 4.5, icon: '💧', desc: 'Tracks water intake, reminds you to hydrate. LED display.' },
  { name: 'Yoga Mat', category: 'Equipment', price: '£34.99', rating: 4.8, icon: '🧘', desc: 'Extra thick for joint support. Non-slip surface, eco-friendly materials.' },
  { name: 'Adjustable Dumbbells', category: 'Equipment', price: '£149.99', rating: 4.9, icon: '💪', desc: 'Replace 15 sets of weights. Space-saving design for home gyms.' },
  { name: 'Fitness Tracker', category: 'Tech', price: '£79.99', rating: 4.6, icon: '⌚', desc: 'Heart rate, sleep, steps, and workout tracking. 7-day battery life.' },
  { name: 'Meal Prep Containers', category: 'Accessories', price: '£19.99', rating: 4.7, icon: '🍱', desc: '10-pack glass containers. Microwave and freezer safe.' },
  { name: 'Creatine Monohydrate', category: 'Supplements', price: '£24.99', rating: 4.8, icon: '💊', desc: 'Most researched supplement. 5g daily for strength and power.' },
  { name: 'Gym Bag', category: 'Accessories', price: '£44.99', rating: 4.5, icon: '👜', desc: 'Separate shoe compartment. Water-resistant, multiple pockets.' },
  { name: 'Jump Rope', category: 'Equipment', price: '£14.99', rating: 4.7, icon: '🪢', desc: 'Adjustable length, ball bearings for smooth rotation. Great cardio.' },
]

const categories = ['All', 'Equipment', 'Supplements', 'Apparel', 'Accessories', 'Recovery', 'Tech']

export default function MerchPage() {
  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">🛍️ Recommended Gear</h1>
            <p className="text-gray-400 mt-1">My favorite fitness products and equipment</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(c => <button key={c} className="px-4 py-2 rounded-full text-sm bg-white/5 text-gray-400 hover:bg-white/10">{c}</button>)}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <div key={i} className="card overflow-hidden group">
                <div className="h-28 flex items-center justify-center text-5xl bg-gradient-to-br from-primary/10 to-accent/10 -mx-6 -mt-6 mb-4 group-hover:scale-105 transition-transform">{product.icon}</div>
                <span className="text-xs text-accent uppercase tracking-wider">{product.category}</span>
                <h3 className="font-display text-lg font-semibold mt-1">{product.name}</h3>
                <p className="text-gray-400 text-sm mt-2">{product.desc}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-display text-lg font-bold text-success">{product.price}</span>
                  <span className="text-warning">⭐ {product.rating}</span>
                </div>
                <button className="btn-secondary w-full mt-4">View Product</button>
              </div>
            ))}
          </div>

          <div className="card text-center">
            <p className="text-gray-400">💡 These are personal recommendations. Links may be added in the future.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
