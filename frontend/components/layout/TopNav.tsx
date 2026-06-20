'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function TopNav() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      const supabase = createClient()
      const { data } = await supabase.rpc('unread_message_count')
      setUnreadCount(data ?? 0)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 font-bold text-water-700 text-lg">
          <span className="text-2xl">⚓</span>
          <span className="hidden sm:inline">My Michigan Lake</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/feed', label: 'Feed' },
            { href: '/marketplace', label: 'Marketplace' },
            { href: '/messages', label: 'Messages' },
            { href: '/alerts', label: 'Alerts' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-water-700 hover:bg-water-50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/messages" className="relative text-gray-500 hover:text-water-700 transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-water-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-water-100 flex items-center justify-center text-water-700 font-semibold text-sm hover:bg-water-200 transition-colors"
          >
            Me
          </Link>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
