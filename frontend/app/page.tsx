import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const FEATURES = [
  { icon: '🌊', label: 'Water Conditions', desc: 'Real-time crowd-sourced reports' },
  { icon: '⛵', label: 'Dock Exchange', desc: 'Buy, sell & rent lake gear' },
  { icon: '🚨', label: 'Safety Alerts', desc: 'Live NOAA notices for your county' },
]

const RIPPLES = [
  { top: '57%', mx: '8%',  delay: '0s',    dur: '3.0s' },
  { top: '64%', mx: '14%', delay: '0.5s',  dur: '3.4s' },
  { top: '71%', mx: '20%', delay: '1.0s',  dur: '2.8s' },
  { top: '78%', mx: '26%', delay: '1.5s',  dur: '3.2s' },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/feed')

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-16">

      {/* ── Sky → water gradient ── */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #87BDDF 0%, #4A98C9 20%, #2B78BF 36%, #1a62d2 50%, #1c4faa 66%, #132f72 82%, #0a1e48 100%)',
      }} />

      {/* ── Shimmer light stripe on the water ── */}
      <div
        className="absolute inset-x-0"
        style={{
          top: '50%', bottom: 0,
          background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.09) 50%, transparent 75%)',
          backgroundSize: '300% 100%',
          animation: 'lake-shimmer 9s linear infinite',
        }}
      />

      {/* ── Golden horizon glow ── */}
      <div className="absolute inset-x-0" style={{
        top: '48.5%',
        height: '3px',
        background: 'linear-gradient(90deg, transparent 5%, rgba(240,190,70,0.55) 30%, rgba(255,215,90,0.85) 50%, rgba(240,190,70,0.55) 70%, transparent 95%)',
      }} />

      {/* ── Rolling treeline silhouette ── */}
      <svg
        viewBox="0 0 1440 90"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute w-full"
        style={{ top: '38%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <path
          d="M0,90 L0,72
             C60,58 120,75 180,62
             C240,49 300,68 360,55
             C420,42 480,65 540,50
             C600,35 660,60 720,44
             C780,28 840,52 900,38
             C960,24 1020,50 1080,42
             C1140,34 1200,56 1260,48
             C1320,40 1380,58 1440,52
             L1440,90 Z"
          fill="#08193a"
          opacity="0.82"
        />
      </svg>

      {/* ── Water ripple lines ── */}
      {RIPPLES.map((r, i) => (
        <div
          key={i}
          className="absolute inset-x-0"
          style={{
            top: r.top,
            marginLeft: r.mx,
            marginRight: r.mx,
            height: '1px',
            background: 'rgba(255,255,255,0.22)',
            borderRadius: '999px',
            animation: `ripple-line ${r.dur} ease-in-out infinite`,
            animationDelay: r.delay,
          }}
        />
      ))}

      {/* ── Page content ── */}
      <div className="relative z-10 max-w-2xl w-full text-center space-y-7">

        {/* Logo */}
        <div
          className="flex items-center justify-center gap-3"
          style={{ animation: 'anchor-float 4.5s ease-in-out infinite' }}
        >
          <span className="text-6xl drop-shadow-lg">⚓</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
            My Michigan Lake
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-lg md:text-xl leading-relaxed max-w-lg mx-auto drop-shadow"
           style={{ color: 'rgba(255,255,255,0.88)' }}>
          The neighborhood network built for Michigan lake communities — connect with dock neighbors,
          share water conditions, and stay safe on the water.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center pt-1">
          <Link
            href="/sign-up"
            className="bg-white text-water-700 font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-water-50 transition-all duration-150"
          >
            Join your neighborhood
          </Link>
          <Link
            href="/sign-in"
            className="font-semibold px-8 py-3 rounded-xl transition-all duration-150 hover:-translate-y-0.5"
            style={{
              border: '2px solid rgba(255,255,255,0.6)',
              color: 'white',
              backdropFilter: 'blur(8px)',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            Sign in
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="rounded-2xl p-5 space-y-2 text-white"
              style={{
                background: 'rgba(255,255,255,0.11)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <div className="text-3xl">{f.icon}</div>
              <div className="font-bold text-sm">{f.label}</div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Subtle lake name attribution */}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Serving 56 Michigan lakes · From Torch Lake to Walloon
        </p>
      </div>
    </main>
  )
}
