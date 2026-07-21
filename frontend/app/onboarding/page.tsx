'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { haversineMiles } from '@/lib/geo'

type Step = 'profile' | 'property' | 'done'

interface Lake {
  id: string
  name: string
  county: string | null
  lat: number
  lng: number
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lakes, setLakes] = useState<Lake[]>([])
  const [lakeInput, setLakeInput] = useState('')
  const [suggestions, setSuggestions] = useState<Lake[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [lakeConfirmed, setLakeConfirmed] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState({ display_name: '', bio: '' })
  const [property, setProperty] = useState({
    lake_name: '',
    lake_id: '' as string | null,
    address_line1: '',
    city: '',
    state: 'MI',
    zip_code: '',
  })

  // Load lakes reference table once
  useEffect(() => {
    async function fetchLakes() {
      const supabase = createClient()
      const { data } = await supabase.from('lakes').select('id, name, county, lat, lng').order('name')
      setLakes(data ?? [])
    }
    fetchLakes()
  }, [])

  // Filter suggestions as user types
  useEffect(() => {
    if (!lakeInput.trim() || lakeConfirmed) {
      setSuggestions([])
      return
    }
    const q = lakeInput.toLowerCase()
    setSuggestions(lakes.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 6))
  }, [lakeInput, lakes, lakeConfirmed])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectLake(lake: Lake) {
    setLakeInput(lake.name)
    setProperty((p) => ({ ...p, lake_name: lake.name, lake_id: lake.id }))
    setLakeConfirmed(true)
    setSuggestions([])
    setGeoError('')
  }

  function handleLakeInputChange(val: string) {
    setLakeInput(val)
    setLakeConfirmed(false)
    setProperty((p) => ({ ...p, lake_name: '', lake_id: null }))
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    if (lakes.length === 0) {
      setGeoError('Lake data not loaded yet — try again in a moment.')
      return
    }
    setGeoLoading(true)
    setGeoError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        let nearest = lakes[0]
        let minDist = haversineMiles(latitude, longitude, nearest.lat, nearest.lng)
        for (const lake of lakes.slice(1)) {
          const d = haversineMiles(latitude, longitude, lake.lat, lake.lng)
          if (d < minDist) { minDist = d; nearest = lake }
        }
        selectLake(nearest)
        setGeoLoading(false)
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? 'Location access denied — type your lake name instead.'
            : 'Could not get your location. Type your lake name instead.'
        )
        setGeoLoading(false)
      },
      { timeout: 8000 }
    )
  }

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
      lake_id: property.lake_id || null,
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
          <p className="text-gray-500 text-sm mt-1">Let&apos;s get your waterfront profile set up.</p>
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

            {/* Lake picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Lake name</label>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={geoLoading}
                  className="text-xs text-water-600 font-medium hover:underline disabled:opacity-50 flex items-center gap-1"
                >
                  {geoLoading ? 'Locating...' : '📍 Use my location'}
                </button>
              </div>

              <div className="relative" ref={suggestionsRef}>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400 ${
                    lakeConfirmed ? 'border-green-400 bg-green-50' : ''
                  }`}
                  value={lakeInput}
                  onChange={(e) => handleLakeInputChange(e.target.value)}
                  placeholder="Search Michigan lakes..."
                  autoComplete="off"
                />
                {lakeConfirmed && (
                  <span className="absolute right-3 top-2.5 text-green-500 text-sm">✓</span>
                )}

                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((lake) => (
                      <button
                        key={lake.name}
                        type="button"
                        onMouseDown={() => selectLake(lake)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-water-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900">{lake.name}</span>
                        {lake.county && (
                          <span className="text-gray-400 text-xs">{lake.county} Co.</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {geoError && <p className="text-red-500 text-xs mt-1">{geoError}</p>}
              {!lakeConfirmed && lakeInput && suggestions.length === 0 && (
                <p className="text-amber-600 text-xs mt-1">
                  Lake not found in our list — you can still type it manually.
                </p>
              )}
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
                disabled={loading || !property.address_line1 || !property.city || !property.zip_code}
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
            <h2 className="font-bold text-gray-900">You&apos;re in the neighborhood!</h2>
            <p className="text-gray-500 text-sm">Taking you to your feed...</p>
          </div>
        )}
      </div>
    </div>
  )
}
