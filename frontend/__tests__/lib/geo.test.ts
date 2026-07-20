import { describe, it, expect } from 'vitest'
import { haversineMiles } from '../../lib/geo'

describe('haversineMiles', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineMiles(44.972, -85.311, 44.972, -85.311)).toBe(0)
  })

  it('is symmetric — A→B equals B→A', () => {
    const d1 = haversineMiles(44.972, -85.311, 42.398, -85.411)
    const d2 = haversineMiles(42.398, -85.411, 44.972, -85.311)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.0001)
  })

  it('returns a plausible distance between Torch Lake and Gull Lake (~170 miles)', () => {
    // Torch Lake: 44.972, -85.311 | Gull Lake: 42.398, -85.411
    const d = haversineMiles(44.972, -85.311, 42.398, -85.411)
    expect(d).toBeGreaterThan(160)
    expect(d).toBeLessThan(180)
  })

  it('one degree of latitude is ~69 miles', () => {
    const d = haversineMiles(44.0, -85.0, 45.0, -85.0)
    expect(d).toBeCloseTo(69, 0)
  })

  it('selects nearest lake correctly from a small set', () => {
    const lakes = [
      { name: 'Torch Lake', lat: 44.972, lng: -85.311 },
      { name: 'Gull Lake', lat: 42.398, lng: -85.411 },
      { name: 'Higgins Lake', lat: 44.482, lng: -84.755 },
    ]
    // Point close to Torch Lake
    const userLat = 44.95
    const userLng = -85.30
    const nearest = lakes.reduce((best, lake) => {
      const d = haversineMiles(userLat, userLng, lake.lat, lake.lng)
      const bestD = haversineMiles(userLat, userLng, best.lat, best.lng)
      return d < bestD ? lake : best
    })
    expect(nearest.name).toBe('Torch Lake')
  })
})
