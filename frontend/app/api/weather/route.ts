import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface ResolvedLake {
  name: string
  lat: number
  lng: number
  source: 'seeded' | 'geocoded'
}

async function resolveLake(name: string): Promise<ResolvedLake | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Exact case-insensitive match, then partial — tolerates the table not existing yet
  const { data: exact } = await supabase
    .from('lakes')
    .select('name, lat, lng')
    .ilike('name', name)
    .limit(1)
    .maybeSingle()
  if (exact) return { ...exact, source: 'seeded' }

  const { data: partial } = await supabase
    .from('lakes')
    .select('name, lat, lng')
    .ilike('name', `%${name}%`)
    .limit(1)
    .maybeSingle()
  if (partial) return { ...partial, source: 'seeded' }

  // Fallback: Open-Meteo geocoding, restricted to Michigan results
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`,
    { next: { revalidate: 86400 } }
  )
  if (!res.ok) return null
  const json = await res.json()
  const hit = (json.results ?? []).find(
    (r: { country_code?: string; admin1?: string }) =>
      r.country_code === 'US' && r.admin1 === 'Michigan'
  )
  if (!hit) return null
  return { name: hit.name, lat: hit.latitude, lng: hit.longitude, source: 'geocoded' }
}

export async function GET(request: NextRequest) {
  const lake = request.nextUrl.searchParams.get('lake')?.trim()
  if (!lake) {
    return NextResponse.json({ error: 'Missing ?lake= parameter' }, { status: 400 })
  }

  const resolved = await resolveLake(lake)
  if (!resolved) {
    return NextResponse.json({ error: `Could not locate lake "${lake}"` }, { status: 404 })
  }

  const params = new URLSearchParams({
    latitude: String(resolved.lat),
    longitude: String(resolved.lng),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'America/Detroit',
    forecast_days: '3',
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 1800 },
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'Weather service unavailable' }, { status: 502 })
  }
  const data = await res.json()

  return NextResponse.json({
    lake: resolved.name,
    requestedLake: lake,
    source: resolved.source,
    current: {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
      uvIndex: data.current.uv_index,
      time: data.current.time,
    },
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      high: data.daily.temperature_2m_max[i],
      low: data.daily.temperature_2m_min[i],
      precipChance: data.daily.precipitation_probability_max[i],
    })),
  })
}
