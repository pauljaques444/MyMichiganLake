'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/supabase/queries'
import { SafetyModal } from './SafetyModal'

interface MessageThreadProps {
  listingId: string
  sellerId: string
  sellerName: string
}

export function MessageThread({ listingId, sellerId, sellerName }: MessageThreadProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showSafety, setShowSafety] = useState(false)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data: convo } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id)
        .maybeSingle()

      if (convo) {
        setConversationId(convo.id)
        setStarted(true)
        await fetchMessages(supabase, convo.id, user.id)
      }
      setLoading(false)
    }
    init()
  }, [listingId])

  async function fetchMessages(supabase: ReturnType<typeof createClient>, convId: string, uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])

    // Mark incoming messages as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .neq('sender_id', uid)
      .is('read_at', null)
  }

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !userId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          if (payload.new.sender_id !== userId) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', payload.new.id)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startConversation() {
    setShowSafety(false)
    const supabase = createClient()
    const { data: convo } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId, buyer_id: userId, seller_id: sellerId })
      .select()
      .single()
    if (convo) {
      setConversationId(convo.id)
      setStarted(true)
    }
  }

  async function sendMessage() {
    if (!input.trim() || !conversationId || !userId || sending) return
    setSending(true)
    const body = input.trim()
    const supabase = createClient()
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      body,
    })
    setInput('')
    setSending(false)

    // Fire-and-forget email notification — don't block the UI
    fetch('/api/notify-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, messageBody: body, senderId: userId }),
    })
  }

  if (loading) return null

  if (!started) {
    return (
      <>
        <button
          onClick={() => setShowSafety(true)}
          className="w-full bg-water-600 text-white font-semibold py-3 rounded-lg hover:bg-water-700 transition-colors"
        >
          Message Seller
        </button>
        {showSafety && (
          <SafetyModal onConfirm={startConversation} onCancel={() => setShowSafety(false)} />
        )}
      </>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-water-100 flex items-center justify-center text-water-700 text-xs font-bold">
          {sellerName[0]?.toUpperCase()}
        </div>
        <p className="text-sm font-medium text-gray-700">{sellerName}</p>
      </div>

      <div className="h-56 overflow-y-auto p-3 space-y-2 bg-white">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">Send a message to start the conversation</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                msg.sender_id === userId
                  ? 'bg-water-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}
            >
              {msg.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-2 flex gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-water-400"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="bg-water-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-water-700 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
