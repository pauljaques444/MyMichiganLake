/**
 * Tests for GET /api/weather?lake=<name>
 *
 * Resolution order:
 *   1. Exact case-insensitive match in lakes table
 *   2. Partial match in lakes table
 *   3. Open-Meteo geocoding API fallback (Michigan results only)
 *   4. 404 if none found
 *
 * External dependencies mocked: @supabase/supabase-js, global fetch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockMaybySingle = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        ilike: () => ({
          limit: () => ({ maybeSingle: mockMaybySingle }),
        }),
      }),
    }),
  })),
}))

// Minimal valid Open-Meteo response
const WEATHER_RESPONSE = {
  current: {
    temperature_2m: 72,
    apparent_temperature: 70,
    relative_humidity_2m: 55,
    weather_code: 1,
    wind_speed_10m: 8,
    wind_direction_10m: 270,
    wind_gusts_10m: 12,
    uv_index: 4,
    time: '2026-07-19T14:00',
  },
  daily: {
    time: ['2026-07-19', '2026-07-20', '2026-07-21'],
    weather_code: [1, 3, 80],
    temperature_2m_max: [75, 70, 65],
    temperature_2m_min: [58, 55, 52],
    precipitation_probability_max: [5, 20, 60],
  },
}

function makeRequest(lakeName: string) {
  return new NextRequest(`http://localhost/api/weather?lake=${encodeURIComponent(lakeName)}`)
}

function makeFetch({
  geocodingResult = null as null | object,
  weatherOk = true,
} = {}) {
  return vi.fn((url: string) => {
    if (url.includes('geocoding-api.open-meteo.com')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: geocodingResult ? [geocodingResult] : [],
          }),
      })
    }
    if (url.includes('api.open-meteo.com')) {
      return Promise.resolve({
        ok: weatherOk,
        json: () => Promise.resolve(WEATHER_RESPONSE),
      })
    }
    return Promise.resolve({ ok: false })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/weather', () => {
  it('returns 400 when the ?lake= parameter is missing', async () => {
    const { GET } = await import('../../app/api/weather/route')
    const req = new NextRequest('http://localhost/api/weather')
    const res = await GET(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing/i)
  })

  it('returns weather data with source: seeded when lake is found by exact match', async () => {
    // First maybySingle call (exact match) returns a row
    mockMaybySingle.mockResolvedValueOnce({ data: { name: 'Torch Lake', lat: 44.972, lng: -85.311 } })
    vi.stubGlobal('fetch', makeFetch())

    const { GET } = await import('../../app/api/weather/route')
    const res = await GET(makeRequest('Torch Lake'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.lake).toBe('Torch Lake')
    expect(body.source).toBe('seeded')
    expect(body.current.temp).toBe(72)
    expect(body.daily).toHaveLength(3)
  })

  it('returns weather data with source: seeded when lake is found by partial match', async () => {
    // Exact match misses, partial match hits
    mockMaybySingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { name: 'Torch Lake', lat: 44.972, lng: -85.311 } })
    vi.stubGlobal('fetch', makeFetch())

    const { GET } = await import('../../app/api/weather/route')
    const res = await GET(makeRequest('torch'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe('seeded')
    expect(body.lake).toBe('Torch Lake')
  })

  it('falls back to geocoding when lake is not in the database', async () => {
    // Both DB lookups miss
    mockMaybySingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null })
    vi.stubGlobal(
      'fetch',
      makeFetch({
        geocodingResult: {
          country_code: 'US',
          admin1: 'Michigan',
          name: 'Lake Ann',
          latitude: 44.726,
          longitude: -85.988,
        },
      })
    )

    const { GET } = await import('../../app/api/weather/route')
    const res = await GET(makeRequest('Lake Ann'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe('geocoded')
    expect(body.lake).toBe('Lake Ann')
  })

  it('returns 404 when geocoding returns a non-Michigan result', async () => {
    mockMaybySingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null })
    vi.stubGlobal(
      'fetch',
      makeFetch({
        geocodingResult: { country_code: 'US', admin1: 'Wisconsin', name: 'Lake Geneva', latitude: 42.59, longitude: -88.43 },
      })
    )

    const { GET } = await import('../../app/api/weather/route')
    const res = await GET(makeRequest('Lake Geneva'))

    expect(res.status).toBe(404)
  })

  it('returns 404 when the lake cannot be found anywhere', async () => {
    mockMaybySingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null })
    vi.stubGlobal('fetch', makeFetch({ geocodingResult: null }))

    const { GET } = await import('../../app/api/weather/route')
    const res = await GET(makeRequest('Lake Atlantis'))

    expect(res.status).toBe(404)
  })

  it('returns 502 when the Open-Meteo weather API is unavailable', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: { name: 'Torch Lake', lat: 44.972, lng: -85.311 } })
    vi.stubGlobal('fetch', makeFetch({ weatherOk: false }))

    const { GET } = await import('../../app/api/weather/route')
    const res = await GET(makeRequest('Torch Lake'))

    expect(res.status).toBe(502)
  })

  it('shapes the response with the correct fields', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: { name: 'Higgins Lake', lat: 44.482, lng: -84.755 } })
    vi.stubGlobal('fetch', makeFetch())

    const { GET } = await import('../../app/api/weather/route')
    const res = await GET(makeRequest('Higgins Lake'))
    const body = await res.json()

    expect(body).toMatchObject({
      lake: 'Higgins Lake',
      source: 'seeded',
      current: expect.objectContaining({
        temp: expect.any(Number),
        feelsLike: expect.any(Number),
        humidity: expect.any(Number),
        windSpeed: expect.any(Number),
        uvIndex: expect.any(Number),
      }),
      daily: expect.arrayContaining([
        expect.objectContaining({ date: expect.any(String), high: expect.any(Number), low: expect.any(Number) }),
      ]),
    })
  })
})
