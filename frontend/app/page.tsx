import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const NAV_LINKS = [
  { label: 'About',           href: '#about' },
  { label: 'Community',       href: '#features' },
  { label: 'Marketplace',     href: '#features' },
  { label: 'Lakes',           href: '#lakes' },
  { label: 'Partner With Us', href: '/partners' },
]

const FEATURES = [
  {
    icon: '💬',
    label: 'Community Feed',
    desc: 'Post updates, ask questions, and stay connected with your dock neighbors in real time.',
    href: '/sign-up',
  },
  {
    icon: '⛵',
    label: 'Dock Exchange',
    desc: 'Buy, sell, and rent boats, docks, gear, and lake equipment from people on your lake.',
    href: '/sign-up',
  },
  {
    icon: '🌊',
    label: 'Water Conditions',
    desc: 'Crowd-sourced reports on water clarity, algae, weed growth, and lake levels.',
    href: '/sign-up',
  },
  {
    icon: '🚨',
    label: 'Safety Alerts',
    desc: 'Live NOAA weather notices and emergency alerts scoped to your county and lake.',
    href: '/sign-up',
  },
  {
    icon: '🗺️',
    label: 'Lake Directory',
    desc: '56 Michigan lakes covered — from Torch Lake in the north to Gull Lake in the south.',
    href: '#lakes',
  },
]

const LAKES = [
  'Torch Lake', 'Higgins Lake', 'Walloon Lake', 'Elk Lake', 'Lake Charlevoix',
  'Crystal Lake', 'Gull Lake', 'Houghton Lake', 'Mullett Lake', 'Glen Lake',
  'Hamlin Lake', 'Silver Lake', 'Burt Lake', 'White Lake', 'Gun Lake',
  'Lake Gogebic', 'Indian Lake', 'Portage Lake', 'Walled Lake', 'Cass Lake',
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/feed')

  return (
    <div className="min-h-screen bg-white text-gray-800">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-water-700 shrink-0">
            <span className="text-2xl">⚓</span>
            <span>My Michigan Lake</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-water-700 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/sign-in"
              className="text-sm font-semibold text-gray-600 hover:text-water-700 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/sign-up"
              className="text-sm font-bold bg-water-600 text-white px-4 py-2 rounded-lg hover:bg-water-700 transition-colors">
              Join Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center"
        style={{
          minHeight: '88vh',
          backgroundImage: "url('/michigan-lake.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 60%',
        }}
      >
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(0,10,30,0.55) 0%, rgba(0,10,30,0.35) 55%, rgba(0,10,30,0.65) 100%)',
        }} />

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,220,100,0.9)' }}>
            Serving 56 Michigan Lakes
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
            Your Michigan Lake<br />Community Network
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
            Connect with dock neighbors, share water conditions, buy and sell lake gear,
            and stay safe on the water — all in one place built for Michigan lake owners.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link href="/sign-up"
              className="bg-white text-water-700 font-bold px-8 py-3.5 rounded-xl shadow-lg hover:bg-water-50 hover:-translate-y-0.5 transition-all duration-150">
              Join Your Lake Community
            </Link>
            <a href="#about"
              className="font-semibold px-8 py-3.5 rounded-xl transition-all duration-150 hover:-translate-y-0.5"
              style={{
                border: '2px solid rgba(255,255,255,0.55)',
                color: 'white',
                backdropFilter: 'blur(8px)',
                background: 'rgba(255,255,255,0.08)',
              }}>
              Learn More
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <div className="w-5 h-8 border-2 rounded-full border-current flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-current rounded-full" style={{ animation: 'anchor-float 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-widest text-water-600">About Us</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              The neighborhood network built for Michigan lake communities
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              My Michigan Lake is the private platform connecting property owners and residents
              on Michigan&apos;s inland lakes. Whether you&apos;re on Torch Lake, Walloon, or Gull Lake,
              you get a dedicated space to talk with your dock neighbors, monitor conditions,
              and trade lake gear — all scoped to your specific lake.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Think of it as the NextDoor for lake communities — but built around the water,
              the seasons, and the lifestyle that makes Michigan lake life unique.
            </p>
            <Link href="/sign-up"
              className="inline-block bg-water-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-water-700 transition-colors">
              Join Your Neighborhood →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '56', label: 'Michigan Lakes Covered' },
              { value: '5', label: 'Core Features' },
              { value: '100%', label: 'Michigan Focused' },
              { value: 'Free', label: 'To Join' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl p-6 text-center space-y-1"
                style={{ background: '#f0f7ff', border: '1px solid #d0e7ff' }}>
                <div className="text-3xl font-extrabold text-water-700">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-water-600">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Everything your lake community needs
            </h2>
            <p className="text-gray-500 text-lg">
              Five tools built specifically for life on the water.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <Link key={f.label} href={f.href}
                className="group bg-white rounded-2xl p-7 space-y-3 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-4xl">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-water-700 transition-colors">
                  {f.label}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                <span className="text-sm font-semibold text-water-600 group-hover:underline">
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LAKES DIRECTORY ── */}
      <section id="lakes" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-water-600">Lake Directory</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              56 Michigan Lakes and Counting
            </h2>
            <p className="text-gray-500 text-lg">
              From the northern tip of the Lower Peninsula to Oakland County — if it&apos;s a Michigan
              lake, we&apos;ve got your community covered.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {LAKES.map(lake => (
              <span key={lake}
                className="px-4 py-2 rounded-full text-sm font-medium border border-water-200 text-water-700 bg-water-50 hover:bg-water-100 transition-colors cursor-default">
                {lake}
              </span>
            ))}
            <span className="px-4 py-2 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-400">
              + 36 more lakes
            </span>
          </div>

          <div className="text-center">
            <Link href="/sign-up"
              className="inline-block bg-water-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-water-700 transition-colors">
              Find Your Lake →
            </Link>
          </div>
        </div>
      </section>

      {/* ── JOIN CTA ── */}
      <section className="py-20 px-4"
        style={{
          backgroundImage: "url('/michigan-lake.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}>
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl" style={{ background: 'rgba(0,15,40,0.72)', backdropFilter: 'blur(1px)' }} />
          <div className="relative z-10 max-w-3xl mx-auto text-center text-white space-y-6 py-16">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Ready to join your lake community?
            </h2>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.82)' }}>
              Create your free account and connect with the neighbors who share your shoreline.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/sign-up"
                className="bg-white text-water-700 font-bold px-8 py-3.5 rounded-xl hover:bg-water-50 hover:-translate-y-0.5 transition-all shadow-lg">
                Join Free Today
              </Link>
              <Link href="/sign-in"
                className="font-semibold px-8 py-3.5 rounded-xl text-white transition-all hover:-translate-y-0.5"
                style={{ border: '2px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.08)' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-4">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-extrabold text-lg">
              <span className="text-xl">⚓</span>
              <span>My Michigan Lake</span>
            </div>
            <p className="text-sm leading-relaxed">
              The private community network for Michigan lake property owners and residents.
            </p>
            <p className="text-xs">Serving 56 Michigan lakes</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm">
              {['Community Feed', 'Dock Exchange', 'Water Conditions', 'Safety Alerts', 'Lake Directory'].map(l => (
                <li key={l}><Link href="/sign-up" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sign-up" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link href="/sign-in" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/forgot-password" className="hover:text-white transition-colors">Reset Password</Link></li>
              <li><Link href="/partners" className="hover:text-white transition-colors">Advertise With Us</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Michigan</h4>
            <ul className="space-y-2 text-sm">
              {['Torch Lake', 'Walloon Lake', 'Higgins Lake', 'Gull Lake', 'Crystal Lake'].map(l => (
                <li key={l}><span className="cursor-default">{l}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} My Michigan Lake. All rights reserved.</p>
          <p>Built for Michigan lake communities · Pure Michigan</p>
        </div>
      </footer>

    </div>
  )
}
