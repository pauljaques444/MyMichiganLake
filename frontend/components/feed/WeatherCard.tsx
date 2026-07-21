'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface CurrentWeather {
  temp: number
  feelsLike: number
  humidity: number
  weatherCode: number
  windSpeed: number
  windDirection: number
  windGusts: number
  uvIndex: number
  time: string
}

interface DailyForecast {
  date: string
  weatherCode: number
  high: number
  low: number
  precipChance: number
}

interface WeatherData {
  lake: string
  current: CurrentWeather
  daily: DailyForecast[]
}

// WMO weather interpretation codes → label + emoji
function describeWeather(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: '☀️' }
  if (code === 1) return { label: 'Mostly clear', icon: '🌤️' }
  if (code === 2) return { label: 'Partly cloudy', icon: '⛅' }
  if (code === 3) return { label: 'Overcast', icon: '☁️' }
  if (code === 45 || code === 48) return { label: 'Fog', icon: '🌫️' }
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: '🌦️' }
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: '🌧️' }
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: '🌨️' }
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: '🌦️' }
  if (code === 85 || code === 86) return { label: 'Snow showers', icon: '🌨️' }
  if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️' }
  return { label: 'Unknown', icon: '🌡️' }
}

function compassDirection(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(degrees / 45) % 8]
}

function dayLabel(date: string, index: number): string {
  if (index === 0) return 'Today'
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
}

interface Props {
  lakeName?: string | null
}

export default function WeatherCard({ lakeName: lakeNameProp }: Props = {}) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [noLake, setNoLake] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        let lakeName = lakeNameProp ?? null

        // Only fetch profile if lake wasn't passed in from parent
        if (lakeName === undefined || lakeName === null) {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return setFailed(true)

          const { data: profile } = await supabase
            .from('profiles')
            .select('lake_name')
            .eq('id', user.id)
            .single()

          lakeName = profile?.lake_name ?? null
        }

        if (!lakeName) return setNoLake(true)

        const res = await fetch(`/api/weather?lake=${encodeURIComponent(lakeName)}`)
        if (!res.ok) return setFailed(true)
        setWeather(await res.json())
      } catch {
        setFailed(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lakeNameProp])

  // A broken weather card shouldn't break the feed
  if (failed) return null

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="h-3 w-32 bg-gray-200 rounded mb-4" />
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-gray-200 rounded" />
          <div className="space-y-2">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-3 w-36 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (noLake) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-500 flex items-center gap-3">
        <span className="text-2xl">🌊</span>
        <span>
          <Link href="/profile" className="text-sky-700 font-medium hover:underline">
            Set your lake
          </Link>{' '}
          to see live weather conditions here.
        </span>
      </div>
    )
  }

  if (!weather) return null

  const { label, icon } = describeWeather(weather.current.weatherCode)

  return (
    <div className="rounded-xl border border-sky-200 overflow-hidden">
      <div className="bg-gradient-to-br from-sky-500 to-sky-700 text-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sky-100 text-xs font-medium uppercase tracking-wide">
              {weather.lake}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-4xl font-bold">{Math.round(weather.current.temp)}°</span>
              <div className="text-sm">
                <p className="font-medium">
                  {icon} {label}
                </p>
                <p className="text-sky-100">
                  Feels like {Math.round(weather.current.feelsLike)}°
                </p>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-sky-100 space-y-1">
            <p>
              💨 {Math.round(weather.current.windSpeed)} mph{' '}
              {compassDirection(weather.current.windDirection)}
              {weather.current.windGusts > weather.current.windSpeed + 5 &&
                ` (gusts ${Math.round(weather.current.windGusts)})`}
            </p>
            <p>☀️ UV {Math.round(weather.current.uvIndex)}</p>
            <p>💧 {weather.current.humidity}% humidity</p>
          </div>
        </div>
      </div>

      <div className="bg-white grid grid-cols-3 divide-x divide-gray-100">
        {weather.daily.map((day, i) => {
          const d = describeWeather(day.weatherCode)
          return (
            <div key={day.date} className="p-3 text-center">
              <p className="text-xs font-medium text-gray-500">{dayLabel(day.date, i)}</p>
              <p className="text-xl my-0.5">{d.icon}</p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{Math.round(day.high)}°</span>
                <span className="text-gray-400"> / {Math.round(day.low)}°</span>
              </p>
              {day.precipChance > 20 && (
                <p className="text-xs text-sky-600 mt-0.5">💧 {day.precipChance}%</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
