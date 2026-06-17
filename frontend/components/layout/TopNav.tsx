'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function TopNav() {
  const router = useRouter()

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
            { href: '/map', label: 'Map' },
            { href: '/marketplace', label: 'Marketplace' },
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
          <Link href="/alerts" className="relative text-gray-500 hover:text-water-700 transition-colors">
            <Bell size={20} />
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
