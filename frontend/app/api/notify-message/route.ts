import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { conversationId, messageBody, senderId } = await request.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      *,
      listing:listings(id, title),
      buyer:profiles!conversations_buyer_id_fkey(id, display_name),
      seller:profiles!conversations_seller_id_fkey(id, display_name)
    `)
    .eq('id', conversationId)
    .single()

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only send one email per unread streak — no spam if sender sends multiple messages
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('sender_id', senderId)
    .is('read_at', null)

  if ((count ?? 0) > 1) return NextResponse.json({ skipped: 'already notified' })

  const recipientId =
    senderId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id

  const senderProfile =
    senderId === conversation.buyer_id ? conversation.buyer : conversation.seller

  const { data: { user } } = await supabase.auth.admin.getUserById(recipientId)
  if (!user?.email) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mymichiganlake.netlify.app'
  const fromEmail = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `MyMichiganLake <${fromEmail}>`,
      to: user.email,
      subject: `New message about: ${conversation.listing?.title ?? 'your listing'}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
          <div style="background:#0369a1;padding:20px 24px;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">⚓ MyMichiganLake</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 16px">
              <strong>${senderProfile?.display_name ?? 'Someone'}</strong> sent you a message about:<br>
              <span style="color:#0369a1;font-weight:600">${conversation.listing?.title ?? 'your listing'}</span>
            </p>
            <div style="background:#f0f9ff;border-left:4px solid #0369a1;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px">
              <p style="margin:0;font-style:italic;color:#374151">&ldquo;${messageBody}&rdquo;</p>
            </div>
            <a href="${siteUrl}/marketplace/${conversation.listing_id}"
               style="display:inline-block;background:#0369a1;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
              View Listing &amp; Reply &rarr;
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px;margin-bottom:0">
              Keep all replies on the platform — never share financial info in messages.<br>
              You received this because someone messaged you on MyMichiganLake.
            </p>
          </div>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error('Resend error:', error)
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
