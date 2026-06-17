'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'profile' | 'property' | 'done'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState({ display_name: '', bio: '' })
  const [property, setProperty] = useState({
    lake_name: '',
    address_line1: '',
    city: '',
    state: 'MI',
    zip_code: '',
  })

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/sign-in')
      return
    }

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: profile.display_name,
      bio: profile.bio || null,
      lake_name: property.lake_name || null,
      address_line1: property.address_line1,
      city: property.city,
      state: property.state,
      zip_code: property.zip_code,
      onboarding_complete: true,
    })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    setStep('done')
    setTimeout(() => router.push('/feed'), 1500)
  }

  const stepIndex = step === 'profile' ? 0 : step === 'property' ? 1 : 2

  return (
    <div className="min-h-screen bg-gradient-to-b from-water-600 to-water-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <span className="text-4xl">⚓</span>
          <h1 className="text-2xl font-bold mt-2 text-gray-900">Welcome aboard!</h1>
          <p className="text-gray-500 text-sm mt-1">Let's get your waterfront profile set up.</p>
        </div>

        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                stepIndex > i ? 'bg-water-500' : stepIndex === i ? 'bg-water-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 'profile' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">Your Profile</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="E.g. Jane Sailor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400 resize-none"
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell neighbors about yourself and your boat..."
              />
            </div>
            <button
              disabled={!profile.display_name.trim()}
              onClick={() => setStep('property')}
              className="w-full bg-water-600 text-white font-semibold py-2.5 rounded-lg hover:bg-water-700 disabled:opacity-40 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'property' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">Your Waterfront</h2>
            <p className="text-xs text-gray-500">
              Used to connect you with your lake neighbors. Your exact address is never shown publicly.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lake name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
                value={property.lake_name}
                onChange={(e) => setProperty({ ...property, lake_name: e.target.value })}
                placeholder="E.g. Torch Lake"
              />
            </div>
            {(['address_line1', 'city', 'zip_code'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
                  value={property[field]}
                  onChange={(e) => setProperty({ ...property, [field]: e.target.value })}
                />
              </div>
            ))}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('profile')}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                disabled={
                  loading ||
                  !property.address_line1 ||
                  !property.city ||
                  !property.zip_code
                }
                onClick={handleSubmit}
                className="flex-1 bg-water-600 text-white font-semibold py-2.5 rounded-lg hover:bg-water-700 disabled:opacity-40 transition-colors"
              >
                {loading ? 'Saving...' : 'Finish'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-3 py-4">
            <div className="text-5xl">🎉</div>
            <h2 className="font-bold text-gray-900">You're in the neighborhood!</h2>
            <p className="text-gray-500 text-sm">Taking you to your feed...</p>
          </div>
        )}
      </div>
    </div>
  )
}
