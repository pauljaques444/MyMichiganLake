import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/feed')

  return (
    <main className="min-h-screen bg-gradient-to-b from-water-600 to-water-900 flex flex-col items-center justify-center text-white px-4">
      <div className="max-w-2xl text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-5xl">⚓</span>
          <h1 className="text-4xl font-bold tracking-tight">My Michigan Lake</h1>
        </div>
        <p className="text-xl text-water-100">
          The neighborhood network built for Michigan lake communities. Connect with your dock
          neighbors, share water conditions, and stay safe on the lake.
        </p>
        <div className="flex gap-4 justify-center pt-2">
          <Link
            href="/sign-up"
            className="bg-white text-water-700 font-semibold px-8 py-3 rounded-lg hover:bg-water-50 transition-colors"
          >
            Join your neighborhood
          </Link>
          <Link
            href="/sign-in"
            className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-water-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-8 text-center text-sm">
          {[
            { icon: '🌊', label: 'Water Conditions', desc: 'Real-time crowd-sourced reports' },
            { icon: '⛵', label: 'Dock Exchange', desc: 'Share & rent slip space' },
            { icon: '🚨', label: 'Safety Alerts', desc: 'Hazards, weather & NOAA notices' },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 rounded-xl p-4 space-y-1">
              <div className="text-2xl">{f.icon}</div>
              <div className="font-semibold">{f.label}</div>
              <div className="text-water-200 text-xs">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
