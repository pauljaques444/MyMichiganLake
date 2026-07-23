'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Bell, LogOut, Menu, X,
  Home, Map, ShoppingBag, AlertTriangle, MessageSquare, User, Waves, Anchor,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/feed',        label: 'Feed',        icon: Home },
  { href: '/map',         label: 'Map',          icon: Map },
  { href: '/alerts',      label: 'Alerts',       icon: AlertTriangle },
  { href: '/marketplace', label: 'Marketplace',  icon: ShoppingBag },
  { href: '/messages',    label: 'Messages',     icon: MessageSquare },
  { href: '/profile',     label: 'Profile',      icon: User },
]

const WATER_NAV = [
  { href: '/feed?category=water_conditions', label: 'Water Conditions', icon: Waves },
  { href: '/feed?category=safety',           label: 'Safety Posts',     icon: AlertTriangle },
  { href: '/marketplace?type=dock',          label: 'Dock Exchange',    icon: Anchor },
]

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Close menu when route changes
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
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
              className="hidden md:flex w-8 h-8 rounded-full bg-water-100 items-center justify-center text-water-700 font-semibold text-sm hover:bg-water-200 transition-colors"
            >
              Me
            </Link>
            <button
              onClick={handleSignOut}
              className="hidden md:block text-gray-400 hover:text-gray-700 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-down drawer */}
      <div
        ref={menuRef}
        className={cn(
          'md:hidden fixed inset-x-0 top-14 z-40 bg-white border-b border-gray-200 shadow-lg',
          'transition-all duration-200 ease-out overflow-hidden',
          menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        )}
      >
        <div className="px-4 py-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-water-50 text-water-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>

        <div className="px-4 pb-2 pt-1 border-t border-gray-100">
          <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Waterfront</p>
          {WATER_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-14 z-30 bg-black/20"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
