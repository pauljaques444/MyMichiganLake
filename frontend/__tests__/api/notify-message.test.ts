/**
 * Tests for POST /api/notify-message
 *
 * This route sends an email notification to the listing seller (or buyer) when
 * a new message is sent in a conversation. It uses the Supabase service role key
 * (admin privileges) and the Resend API.
 *
 * SECURITY NOTE: This route currently has NO authentication check. Any caller
 * with a valid conversationId and senderId can trigger email notifications.
 * See the .todo test below — it should be a real test once auth is added.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Module-level mock handles — reconfigured per test
const mockConversationSingle = vi.fn()
const mockMessageCountIs = vi.fn()
const mockGetUserById = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'conversations') {
        return {
          select: () => ({
            eq: () => ({ single: mockConversationSingle }),
          }),
        }
      }
      if (table === 'messages') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                is: mockMessageCountIs,
              }),
            }),
          }),
        }
      }
      return {}
    },
    auth: {
      admin: { getUserById: mockGetUserById },
    },
  })),
}))

const FAKE_CONVERSATION = {
  id: 'conv-1',
  listing_id: 'listing-1',
  buyer_id: 'buyer-1',
  seller_id: 'seller-1',
  listing: { id: 'listing-1', title: '2019 Sea-Doo' },
  buyer: { id: 'buyer-1', display_name: 'Alice' },
  seller: { id: 'seller-1', display_name: 'Bob' },
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/notify-message', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: fetch succeeds for Resend
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 'email-id' }) })
  )
})

describe('POST /api/notify-message', () => {
  it.todo('should require authentication — returns 401 for unauthenticated callers (security gap: currently unenforced)')

  it('returns 404 when conversation does not exist', async () => {
    mockConversationSingle.mockResolvedValue({ data: null })

    const { POST } = await import('../../app/api/notify-message/route')
    const res = await POST(makeRequest({ conversationId: 'bad-id', messageBody: 'hi', senderId: 'buyer-1' }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Not found')
  })

  it('skips email when sender already has more than 1 unread message (deduplication)', async () => {
    mockConversationSingle.mockResolvedValue({ data: FAKE_CONVERSATION })
    mockMessageCountIs.mockResolvedValue({ count: 2 })

    const { POST } = await import('../../app/api/notify-message/route')
    const res = await POST(makeRequest({ conversationId: 'conv-1', messageBody: 'hi', senderId: 'buyer-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.skipped).toBe('already notified')
    // Resend should NOT have been called
    expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled()
  })

  it('returns 404 when recipient email cannot be found', async () => {
    mockConversationSingle.mockResolvedValue({ data: FAKE_CONVERSATION })
    mockMessageCountIs.mockResolvedValue({ count: 1 })
    mockGetUserById.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('../../app/api/notify-message/route')
    const res = await POST(makeRequest({ conversationId: 'conv-1', messageBody: 'hi', senderId: 'buyer-1' }))

    expect(res.status).toBe(404)
  })

  it('sends email and returns { sent: true } on success', async () => {
    mockConversationSingle.mockResolvedValue({ data: FAKE_CONVERSATION })
    mockMessageCountIs.mockResolvedValue({ count: 1 })
    mockGetUserById.mockResolvedValue({ data: { user: { id: 'seller-1', email: 'bob@example.com' } } })

    const { POST } = await import('../../app/api/notify-message/route')
    const res = await POST(makeRequest({ conversationId: 'conv-1', messageBody: 'Is it available?', senderId: 'buyer-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(true)

    // Verify Resend was called with correct structure
    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0]
    expect(fetchCall[0]).toBe('https://api.resend.com/emails')
    const fetchBody = JSON.parse(fetchCall[1]?.body as string)
    expect(fetchBody.to).toBe('bob@example.com')
    expect(fetchBody.subject).toContain('2019 Sea-Doo')
    expect(fetchBody.html).toContain('Is it available?')
    expect(fetchBody.html).toContain('Alice') // sender name
  })

  it('correctly identifies the buyer as the recipient when seller sends a message', async () => {
    mockConversationSingle.mockResolvedValue({ data: FAKE_CONVERSATION })
    mockMessageCountIs.mockResolvedValue({ count: 1 })
    mockGetUserById.mockResolvedValue({ data: { user: { id: 'buyer-1', email: 'alice@example.com' } } })

    const { POST } = await import('../../app/api/notify-message/route')
    // Seller (seller-1) sends the message — recipient should be buyer (buyer-1)
    const res = await POST(makeRequest({ conversationId: 'conv-1', messageBody: 'Yes, still for sale', senderId: 'seller-1' }))

    expect(res.status).toBe(200)
    expect(mockGetUserById).toHaveBeenCalledWith('buyer-1')
  })

  it('returns 500 when Resend API fails', async () => {
    mockConversationSingle.mockResolvedValue({ data: FAKE_CONVERSATION })
    mockMessageCountIs.mockResolvedValue({ count: 1 })
    mockGetUserById.mockResolvedValue({ data: { user: { id: 'seller-1', email: 'bob@example.com' } } })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Unauthorized'),
      })
    )

    const { POST } = await import('../../app/api/notify-message/route')
    const res = await POST(makeRequest({ conversationId: 'conv-1', messageBody: 'hi', senderId: 'buyer-1' }))

    expect(res.status).toBe(500)
  })
})
