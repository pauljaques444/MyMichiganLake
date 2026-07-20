/**
 * Tests for middleware.ts — route protection
 *
 * The middleware reads the Supabase session from cookies on every request.
 * If there's no valid session and the route is not public, the user is
 * redirected to /sign-in. Authenticated users on auth pages are sent to /feed.
 *
 * Public routes (no auth required):
 *   /  /sign-in*  /sign-up*  /forgot-password*  /reset-password*  /auth/*
 *
 * Protected routes (auth required — everything else):
 *   /feed  /marketplace*  /messages  /onboarding  /profile  /alerts  etc.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

function makeRequest(path: string) {
  return new NextRequest(`http://localhost${path}`)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('middleware — unauthenticated user', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
  })

  it('redirects to /sign-in when accessing /feed', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/feed'))

    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toContain('/sign-in')
  })

  it('redirects to /sign-in when accessing /marketplace', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/marketplace'))
    expect(res.headers.get('location')).toContain('/sign-in')
  })

  it('redirects to /sign-in when accessing /marketplace/new', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/marketplace/new'))
    expect(res.headers.get('location')).toContain('/sign-in')
  })

  it('redirects to /sign-in when accessing /messages', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/messages'))
    expect(res.headers.get('location')).toContain('/sign-in')
  })

  it('redirects to /sign-in when accessing /onboarding', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/onboarding'))
    expect(res.headers.get('location')).toContain('/sign-in')
  })

  it('allows access to /sign-in (public route)', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/sign-in'))
    // Should pass through — status 200 from NextResponse.next()
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows access to /sign-up (public route)', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/sign-up'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows access to /forgot-password (public route)', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/forgot-password'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows access to /reset-password (public route)', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/reset-password'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows access to /auth/callback (public route)', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/auth/callback'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows access to / (root — public)', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/'))
    expect(res.headers.get('location')).toBeNull()
  })
})

describe('middleware — authenticated user', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } } })
  })

  it('allows access to /feed', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/feed'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows access to /marketplace', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/marketplace'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows access to /messages', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/messages'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects away from /sign-in to /feed (already signed in)', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/sign-in'))

    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get('location')).toContain('/feed')
  })

  it('redirects away from /sign-up to /feed (already signed in)', async () => {
    const { middleware } = await import('../middleware')
    const res = await middleware(makeRequest('/sign-up'))
    expect(res.headers.get('location')).toContain('/feed')
  })
})
