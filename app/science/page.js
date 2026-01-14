'use client'

import Sidebar from '@/components/Sidebar'

const topics = [
  { icon: '📈', title: 'Progressive Overload', desc: 'The key principle behind muscle growth - gradually increasing weight, frequency, or reps over time. Your muscles adapt to stress by getting stronger.' },
  { icon: '🧬', title: 'Protein Synthesis', desc: 'Your body builds muscle through protein synthesis, optimized by consuming 0.7-1g protein per pound of body weight. Timing matters less than total daily intake.' },
  { icon: '🔥', title: 'NEAT & Metabolism', desc: 'Non-Exercise Activity Thermogenesis accounts for up to 15% of daily calorie burn through everyday movements. Small habits like walking and standing add up.' },
  { icon: '😴', title: 'Sleep & Recovery', desc: 'Growth hormone release peaks during deep sleep. Aim for 7-9 hours for optimal muscle recovery, hormone regulation, and mental clarity.' },
  { icon: '💧', title: 'Hydration Science', desc: 'Even 2% dehydration can decrease performance by up to 25%. Water is essential for nutrient transport, temperature regulation, and joint lubrication.' },
  { icon: '🧠', title: 'Mind-Muscle Connection', desc: 'Studies show focusing on the muscle being worked increases activation and growth potential. Visualization and intentional movement improve results.' },
  { icon: '⚡', title: 'Energy Systems', desc: 'Your body uses three energy systems: phosphagen (0-10 sec), glycolytic (10 sec-2 min), and oxidative (2+ min). Training varies based on which system you target.' },
  { icon: '🥗', title: 'Nutrient Timing', desc: 'While total daily intake matters most, eating protein within a few hours of training may optimize muscle protein synthesis. Carbs fuel intense workouts.' },
  { icon: '❤️', title: 'Cardiovascular Adaptation', desc: 'Regular cardio strengthens your heart, improves blood flow, and increases mitochondrial density. Even 20 minutes of daily walking has significant health benefits.' },
  { icon: '🧘', title: 'Flexibility & Mobility', desc: 'Static stretching post-workout improves flexibility. Dynamic stretching pre-workout prepares muscles. Mobility work prevents injury and improves performance.' },
  { icon: '🍷', title: 'Alcohol & Recovery', desc: 'Alcohol impairs protein synthesis by up to 37%, disrupts sleep quality, dehydrates tissues, and reduces testosterone. Even moderate drinking affects gains.' },
  { icon: '🚭', title: 'Smoking & Fitness', desc: 'Smoking reduces lung capacity, impairs oxygen delivery, slows recovery, and increases injury risk. Quitting leads to measurable improvements within days.' },
]

export default function SciencePage() {
  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-5xl mx-auto animate-fadeIn space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">🔬 Fitness & Nutrition Science</h1>
            <p className="text-gray-400 mt-1">Evidence-based information to support your journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic, i) => (
              <div key={i} className="card text-center hover:scale-[1.02] transition-transform">
                <span className="text-4xl block mb-4">{topic.icon}</span>
                <h3 className="font-display text-lg font-semibold mb-3">{topic.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{topic.desc}</p>
              </div>
            ))}
          </div>

          <div className="card bg-gradient-to-r from-primary/10 to-accent/10">
            <h3 className="font-display text-xl font-semibold mb-3">📚 Want to Learn More?</h3>
            <p className="text-gray-400 mb-4">These principles are backed by peer-reviewed research. For deeper dives, check out resources from:</p>
            <ul className="text-gray-300 space-y-2">
              <li>• <strong>Examine.com</strong> - Unbiased supplement and nutrition research</li>
              <li>• <strong>Stronger By Science</strong> - Evidence-based training information</li>
              <li>• <strong>PubMed</strong> - Direct access to scientific studies</li>
              <li>• <strong>Renaissance Periodization</strong> - Science-based programming</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
