'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { haversineMiles } from '@/lib/geo'
import { CheckCircle } from 'lucide-react'

interface Lake {
  id: string
  name: string
  county: string | null
  lat: number
  lng: number
}

interface InitialProfile {
  display_name: string | null
  bio: string | null
  lake_name: string | null
  lake_id: string | null
}

export default function ProfileEditForm({ initial }: { initial: InitialProfile }) {
  const [displayName, setDisplayName] = useState(initial.display_name ?? '')
  const [bio, setBio] = useState(initial.bio ?? '')

  const [lakes, setLakes] = useState<Lake[]>([])
  const [lakeInput, setLakeInput] = useState(initial.lake_name ?? '')
  const [suggestions, setSuggestions] = useState<Lake[]>([])
  const [lakeConfirmed, setLakeConfirmed] = useState(!!initial.lake_name)
  const [selectedLakeId, setSelectedLakeId] = useState<string | null>(initial.lake_id)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchLakes() {
      const supabase = createClient()
      const { data } = await supabase
        .from('lakes')
        .select('id, name, county, lat, lng')
        .order('name')
      setLakes(data ?? [])
    }
    fetchLakes()
  }, [])

  useEffect(() => {
    if (!lakeInput.trim() || lakeConfirmed) {
      setSuggestions([])
      return
    }
    const q = lakeInput.toLowerCase()
    setSuggestions(lakes.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 6))
  }, [lakeInput, lakes, lakeConfirmed])

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
    setSelectedLakeId(lake.id)
    setLakeConfirmed(true)
    setSuggestions([])
    setGeoError('')
  }

  function handleLakeInputChange(val: string) {
    setLakeInput(val)
    setLakeConfirmed(false)
    setSelectedLakeId(null)
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser.')
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

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setSaving(false); return }

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      lake_name: lakeInput.trim() || null,
      lake_id: selectedLakeId,
    })

    if (upsertError) {
      setError(upsertError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="font-semibold text-gray-800">Edit Profile</h2>

      {/* Display name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="E.g. Jane Sailor"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400 resize-none"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell neighbors about yourself and your boat..."
        />
      </div>

      {/* Lake picker */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Your lake</label>
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
                  key={lake.id}
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
            Lake not found in our list — you can still save it manually.
          </p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || !displayName.trim()}
        className="w-full bg-water-600 text-white font-semibold py-2.5 rounded-lg hover:bg-water-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
      >
        {saved ? (
          <>
            <CheckCircle size={16} />
            Saved
          </>
        ) : saving ? (
          'Saving...'
        ) : (
          'Save changes'
        )}
      </button>
    </div>
  )
}
