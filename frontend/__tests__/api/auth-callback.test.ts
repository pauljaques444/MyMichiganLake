/**
 * Tests for GET /auth/callback
 *
 * This route is hit after a user clicks the email confirmation link or the
 * password-reset link. Supabase redirects here with a ?code= param; this
 * route exchanges it for a session and redirects the user onward.
 *
 * Security considerations:
 * - A missing or invalid code must redirect to /sign-in (not crash/expose internals)
 * - The `next` redirect target is taken from the query string — ensure it stays
 *   within the same origin (Next.js handles this via `origin` from the URL)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockExchangeCode = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCode },
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/auth/callback')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /auth/callback', () => {
  it('redirects to /sign-in with error when no code is present', async () => {
    const { GET } = await import('../../app/auth/callback/route')
    const res = await GET(makeRequest({}))

    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toContain('/sign-in?error=auth_callback_failed')
  })

  it('redirects to /onboarding by default when code exchange succeeds', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })

    const { GET } = await import('../../app/auth/callback/route')
    const res = await GET(makeRequest({ code: 'valid-code' }))

    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toContain('/onboarding')
  })

  it('redirects to the ?next= path when code exchange succeeds', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })

    const { GET } = await import('../../app/auth/callback/route')
    const res = await GET(makeRequest({ code: 'valid-code', next: '/reset-password' }))

    expect(res.headers.get('location')).toContain('/reset-password')
    expect(res.headers.get('location')).not.toContain('/sign-in')
  })

  it('redirects to /sign-in with error when Supabase rejects the code', async () => {
    mockExchangeCode.mockResolvedValue({ error: { message: 'Invalid or expired token' } })

    const { GET } = await import('../../app/auth/callback/route')
    const res = await GET(makeRequest({ code: 'bad-code' }))

    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get('location')).toContain('/sign-in?error=auth_callback_failed')
  })

  it('rejects open-redirect — external ?next= falls back to /onboarding', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })

    const { GET } = await import('../../app/auth/callback/route')
    const res = await GET(makeRequest({ code: 'valid-code', next: 'https://evil.com/steal' }))

    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/onboarding')
    expect(location).not.toContain('evil.com')
  })
})
