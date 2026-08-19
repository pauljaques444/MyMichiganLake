'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitPartnerInquiry, type InquiryState } from './actions'

const PLACEMENTS = [
  {
    name: 'Community Feed',
    price: 'Starting at $99/mo',
    desc: 'Your ad appears inline in the community feed — seen by lake residents as they scroll updates from their neighbors.',
    bullets: ['Native feed placement', 'Photo + headline + CTA', 'All lakes or targeted by lake'],
  },
  {
    name: 'Lake-Targeted',
    price: 'Starting at $149/mo',
    desc: 'Reach only the residents on the specific lake(s) your business serves. Perfect for marinas, local services, and contractors.',
    bullets: ['Target 1–5 specific lakes', 'Higher relevance, lower waste', 'Impression tracking included'],
    featured: true,
  },
  {
    name: 'Run-of-House',
    price: 'Starting at $249/mo',
    desc: 'Maximum reach across all 56 Michigan lakes. Ideal for statewide brands, boating retailers, and insurance providers.',
    bullets: ['All 56 Michigan lakes', 'Broad awareness reach', 'Priority placement'],
  },
]

const STATS = [
  { value: '56', label: 'Michigan Lakes' },
  { value: '100%', label: 'Lake Audience' },
  { value: '3', label: 'Ad Placements' },
  { value: '5', label: 'Platform Features' },
]

const LAKES_SAMPLE = [
  'Torch Lake', 'Walloon Lake', 'Higgins Lake', 'Elk Lake', 'Lake Charlevoix',
  'Crystal Lake', 'Gull Lake', 'Houghton Lake', 'White Lake', 'Glen Lake',
]

const initialState: InquiryState = { success: false }

export default function PartnersPage() {
  const [state, action, pending] = useActionState(submitPartnerInquiry, initialState)

  return (
    <div className="min-h-screen bg-white text-gray-800">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-water-700">
            <span className="text-2xl">⚓</span>
            <span>My Michigan Lake</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-semibold text-gray-600 hover:text-water-700 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/sign-up" className="text-sm font-bold bg-water-600 text-white px-4 py-2 rounded-lg hover:bg-water-700 transition-colors">
              Join Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-gray-900 text-white py-20 px-4"
        style={{
          backgroundImage: "url('/michigan-lake.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}>
        <div className="absolute inset-0" style={{ background: 'rgba(0,10,30,0.68)' }} />
        <div className="relative max-w-4xl mx-auto text-center space-y-5">
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'rgba(255,220,100,0.9)' }}>
            Partner With Us
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Reach Michigan&apos;s Lake Communities
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Advertise directly to lake property owners, seasonal residents, and year-round lake
            community members across 56 Michigan lakes.
          </p>
          <a href="#inquiry"
            className="inline-block bg-white text-water-700 font-bold px-8 py-3.5 rounded-xl hover:bg-water-50 transition-colors shadow-lg">
            Get Started →
          </a>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 px-4 border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center space-y-1">
              <div className="text-3xl font-extrabold text-water-700">{s.value}</div>
              <div className="text-sm text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO WE REACH ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-water-600">Our Audience</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Who you&apos;re reaching</h2>
            <p className="text-gray-500">
              Members are lake property owners, seasonal and year-round residents actively engaged
              with their lake community — the exact audience for lake-adjacent businesses.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '🏠', title: 'Lake Property Owners', desc: 'Primary and seasonal homeowners with docks, boats, and lake equipment purchasing decisions.' },
              { icon: '⛵', title: 'Boating Enthusiasts', desc: 'Active boaters who need marinas, fuel, service, slip rentals, and marine products.' },
              { icon: '🏘️', title: 'Lake Community Members', desc: 'Year-round residents who hire local contractors, landscapers, and service providers.' },
            ].map(a => (
              <div key={a.title} className="rounded-2xl p-7 space-y-3 border border-gray-100 bg-white shadow-sm">
                <div className="text-4xl">{a.icon}</div>
                <h3 className="font-bold text-gray-900">{a.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Lakes in our network</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {LAKES_SAMPLE.map(l => (
                <span key={l} className="px-3 py-1.5 rounded-full text-sm font-medium bg-water-50 text-water-700 border border-water-200">
                  {l}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-400">
                + 46 more
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── AD PLACEMENTS ── */}
      <section className="py-16 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-water-600">Ad Options</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Choose your placement</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLACEMENTS.map(p => (
              <div key={p.name}
                className={`rounded-2xl p-7 space-y-4 border-2 relative ${p.featured ? 'border-water-500 shadow-lg' : 'border-gray-100 bg-white shadow-sm'}`}
                style={p.featured ? { background: '#f0f7ff' } : {}}>
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-water-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                  <p className="text-water-700 font-semibold text-sm mt-0.5">{p.price}</p>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
                <ul className="space-y-1.5">
                  {p.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-water-500 mt-0.5">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a href="#inquiry"
                  className={`block text-center font-bold py-2.5 rounded-lg transition-colors text-sm ${p.featured ? 'bg-water-600 text-white hover:bg-water-700' : 'border-2 border-water-300 text-water-700 hover:bg-water-50'}`}>
                  Inquire →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INQUIRY FORM ── */}
      <section id="inquiry" className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <p className="text-sm font-bold uppercase tracking-widest text-water-600">Get In Touch</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Partner inquiry</h2>
            <p className="text-gray-500">
              Fill out the form below and we&apos;ll follow up within one business day to discuss
              placement options and pricing.
            </p>
          </div>

          {state.success ? (
            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-10 text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h3 className="text-xl font-bold text-green-800">Inquiry received!</h3>
              <p className="text-green-700 text-sm">
                Thanks for your interest in partnering with My Michigan Lake. We&apos;ll be in touch
                within one business day.
              </p>
              <Link href="/" className="inline-block text-water-600 font-semibold text-sm hover:underline">
                ← Back to homepage
              </Link>
            </div>
          ) : (
            <form action={action} className="space-y-5 rounded-2xl border border-gray-200 p-8 shadow-sm">
              {state.error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {state.error}
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Business Name <span className="text-red-500">*</span></label>
                  <input name="business_name" required type="text" placeholder="Torch Lake Marina"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Contact Name <span className="text-red-500">*</span></label>
                  <input name="contact_name" required type="text" placeholder="Jane Smith"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Email <span className="text-red-500">*</span></label>
                  <input name="email" required type="email" placeholder="jane@business.com"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Phone</label>
                  <input name="phone" type="tel" placeholder="(231) 555-0100"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Business Website</label>
                <input name="website" type="url" placeholder="https://yoursite.com"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400" />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Which lakes does your business serve?</label>
                <input name="lakes_served" type="text" placeholder="e.g. Torch Lake, Walloon Lake, Lake Charlevoix"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400" />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Ad placement interest</label>
                <select name="ad_interest"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400 bg-white">
                  <option value="">Select one…</option>
                  <option value="community_feed">Community Feed ($99/mo)</option>
                  <option value="lake_targeted">Lake-Targeted ($149/mo)</option>
                  <option value="run_of_house">Run-of-House ($249/mo)</option>
                  <option value="unsure">Not sure yet — let's talk</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Anything else you'd like us to know?</label>
                <textarea name="message" rows={4} placeholder="Tell us about your business and what you're hoping to achieve…"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-water-400 resize-none" />
              </div>

              <button type="submit" disabled={pending}
                className="w-full bg-water-600 text-white font-bold py-3 rounded-lg hover:bg-water-700 disabled:opacity-50 transition-colors">
                {pending ? 'Submitting…' : 'Send Partner Inquiry'}
              </button>

              <p className="text-xs text-center text-gray-400">
                We&apos;ll respond within one business day. No commitment required.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Link href="/" className="flex items-center gap-2 text-white font-bold">
            <span>⚓</span><span>My Michigan Lake</span>
          </Link>
          <p className="text-xs">Serving 56 Michigan lake communities</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/sign-up" className="hover:text-white transition-colors">Join Free</Link>
            <Link href="/sign-in" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
