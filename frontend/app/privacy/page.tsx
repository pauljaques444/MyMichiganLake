import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — My Michigan Lake',
  description: 'How MyMichiganLake collects, uses, and protects your personal information.',
}

const EFFECTIVE_DATE = 'July 22, 2026'
const CONTACT_EMAIL = 'privacy@mymichiganlake.com'
const SITE_URL = 'https://mymichiganlake.netlify.app'
const SITE_NAME = 'MyMichiganLake'

const sections = [
  { id: 'information-we-collect',   label: '1. Information We Collect' },
  { id: 'how-we-use',               label: '2. How We Use Your Information' },
  { id: 'cookies',                  label: '3. Cookies & Tracking' },
  { id: 'advertising',              label: '4. Advertising — Google AdSense' },
  { id: 'third-party-services',     label: '5. Third-Party Services' },
  { id: 'information-sharing',      label: '6. Information Sharing' },
  { id: 'data-retention',           label: '7. Data Retention' },
  { id: 'your-rights',              label: '8. Your Rights & Choices' },
  { id: 'michigan-residents',       label: '9. Michigan Residents' },
  { id: 'california-residents',     label: '10. California Residents (CCPA)' },
  { id: 'childrens-privacy',        label: '11. Children\'s Privacy' },
  { id: 'data-security',            label: '12. Data Security' },
  { id: 'changes',                  label: '13. Changes to This Policy' },
  { id: 'contact',                  label: '14. Contact Us' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-water-700 text-lg">
            <span className="text-2xl">⚓</span>
            <span>My Michigan Lake</span>
          </Link>
          <Link href="/sign-in" className="text-sm text-water-700 font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title block */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-500">
            Effective date: <strong>{EFFECTIVE_DATE}</strong> &nbsp;·&nbsp; Operator:{' '}
            <strong>{SITE_NAME}</strong> ({SITE_URL})
          </p>
          <p className="mt-4 text-base text-gray-700 leading-relaxed">
            {SITE_NAME} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates a
            community marketplace platform for Michigan lakefront homeowners. This Privacy Policy
            explains how we collect, use, disclose, and protect your personal information when you
            use our website and services (collectively, the &ldquo;Service&rdquo;). By using the
            Service you agree to the practices described here.
          </p>
        </div>

        <div className="flex gap-10">
          {/* Sticky TOC — desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-8 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Contents
              </p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-xs text-gray-600 hover:text-water-700 py-0.5 leading-snug"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Policy body */}
          <article className="flex-1 min-w-0 space-y-10 text-gray-700 text-[15px] leading-relaxed">

            {/* ── 1 ── */}
            <section id="information-we-collect">
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>

              <h3 className="font-semibold text-gray-900 mb-2">A. Information you provide directly</h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Account credentials</strong> — email address and password (stored as a
                  bcrypt hash by Supabase Auth; we never see your plaintext password).</li>
                <li><strong>Profile information</strong> — display name, biography, and the name or
                  geographic coordinates of your Michigan lake.</li>
                <li><strong>Content you create</strong> — community feed posts, marketplace listings
                  (title, description, price, photos), and private messages with other users.</li>
                <li><strong>Images</strong> — listing photos you upload are stored in our cloud
                  storage (Supabase Storage) and are publicly accessible by URL once published.</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mb-2">B. Information collected automatically</h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Log data</strong> — IP address, browser type and version, pages visited,
                  timestamps, and referring URL, collected by our hosting provider (Netlify).</li>
                <li><strong>Device information</strong> — operating system, screen resolution, and
                  language settings.</li>
                <li><strong>Usage data</strong> — features used, search queries, and actions taken
                  within the Service.</li>
                <li><strong>Location</strong> — if you use &ldquo;Use my location&rdquo; in onboarding
                  or profile settings, your browser requests your geolocation. We use the
                  coordinates to suggest the nearest lake; precise coordinates are not stored on
                  our servers.</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mb-2">C. Cookies and similar technologies</h3>
              <p>
                We and our third-party partners use cookies and similar tracking technologies.
                See Section 3 for full details.
              </p>
            </section>

            {/* ── 2 ── */}
            <section id="how-we-use">
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Provide and operate the Service</strong> — authenticate your account,
                  display your profile, publish listings and posts, and deliver private messages.</li>
                <li><strong>Email notifications</strong> — send transactional emails such as
                  email-address confirmation, password-reset links, and new-message alerts. These
                  are delivered via Resend. You can stop message-notification emails by not using
                  the messaging feature; account-security emails cannot be disabled.</li>
                <li><strong>Display personalized advertising</strong> — we partner with Google
                  AdSense to show ads that may be personalized based on your browsing history.
                  See Section 4.</li>
                <li><strong>Safety and fraud prevention</strong> — detect and investigate
                  violations of our Terms of Service, abuse, and illegal activity.</li>
                <li><strong>Service improvement</strong> — analyze aggregate usage patterns to
                  improve features and fix bugs.</li>
                <li><strong>Legal compliance</strong> — comply with applicable laws and respond
                  to lawful governmental requests.</li>
              </ul>
            </section>

            {/* ── 3 ── */}
            <section id="cookies">
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. Cookies &amp; Tracking</h2>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 font-semibold border border-gray-200">Cookie / Technology</th>
                      <th className="text-left p-3 font-semibold border border-gray-200">Purpose</th>
                      <th className="text-left p-3 font-semibold border border-gray-200">Set by</th>
                      <th className="text-left p-3 font-semibold border border-gray-200">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-200"><code>sb-*</code> (Supabase auth)</td>
                      <td className="p-3 border border-gray-200">Keeps you signed in between page loads</td>
                      <td className="p-3 border border-gray-200">Us (Supabase)</td>
                      <td className="p-3 border border-gray-200">Session / 1 week</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">Google AdSense (<code>__gads</code>, <code>__gpi</code>)</td>
                      <td className="p-3 border border-gray-200">Ad personalization, frequency capping, fraud prevention</td>
                      <td className="p-3 border border-gray-200">Google LLC</td>
                      <td className="p-3 border border-gray-200">Up to 13 months</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">Google NID / DSID</td>
                      <td className="p-3 border border-gray-200">Personalized ads for signed-in Google accounts</td>
                      <td className="p-3 border border-gray-200">Google LLC</td>
                      <td className="p-3 border border-gray-200">6 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">Managing cookies</h3>
              <p className="mb-3">
                You can control cookies through your browser settings. Disabling session cookies
                will prevent you from staying signed in. To opt out of personalized advertising
                cookies, see Section 4.
              </p>
              <p>
                Most browsers accept cookies by default. Instructions for common browsers:{' '}
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">Chrome</a>,{' '}
                <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">Firefox</a>,{' '}
                <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">Safari</a>.
              </p>
            </section>

            {/* ── 4 ── */}
            <section id="advertising">
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Advertising — Google AdSense</h2>

              <div className="bg-dock-50 border border-dock-200 rounded-xl p-5 mb-5">
                <p className="font-semibold text-dock-800 mb-1">Important disclosure required by Google</p>
                <p className="text-dock-700 text-sm">
                  We use Google AdSense, a third-party advertising service operated by Google LLC
                  (&ldquo;Google&rdquo;). Google may use cookies and web beacons to serve ads based
                  on your prior visits to this site and other sites on the internet.
                </p>
              </div>

              <ul className="list-disc pl-5 space-y-3 mb-5">
                <li>
                  Google&rsquo;s use of advertising cookies enables it and its partners to serve ads
                  to you based on your visit to {SITE_NAME} and/or other sites on the internet.
                </li>
                <li>
                  <strong>Opting out of personalized ads:</strong> You may opt out of personalized
                  advertising by visiting{' '}
                  <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">
                    Google Ads Settings
                  </a>{' '}
                  or by visiting{' '}
                  <a href="https://www.networkadvertising.org/managing/opt_out.asp" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">
                    NAI opt-out
                  </a>.
                  Opting out means you will still see ads, but they will not be personalized to
                  your interests.
                </li>
                <li>
                  Google&rsquo;s privacy practices are described in the{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">
                    Google Privacy Policy
                  </a>.
                </li>
                <li>
                  We do not pass personally identifiable information (PII) such as your name or
                  email address to Google&rsquo;s advertising systems.
                </li>
                <li>
                  Ads displayed on {SITE_NAME} are served through Google&rsquo;s advertising
                  infrastructure. The content of ads is determined by Google and/or advertisers;
                  {SITE_NAME} does not control individual ad content.
                </li>
              </ul>

              <p className="text-sm text-gray-500">
                Publisher ID: ca-pub-1606056559264588
              </p>
            </section>

            {/* ── 5 ── */}
            <section id="third-party-services">
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
              <p className="mb-4">
                We use the following third-party providers to operate the Service. Each acts as a
                data processor on our behalf (except Google AdSense, which acts as an independent
                controller for advertising purposes).
              </p>

              <div className="space-y-4">
                {[
                  {
                    name: 'Supabase, Inc.',
                    role: 'Database, authentication, and file storage',
                    data: 'Email, hashed password, profile data, posts, listings, messages, uploaded images',
                    link: 'https://supabase.com/privacy',
                    location: 'United States (AWS us-east-1)',
                  },
                  {
                    name: 'Resend, Inc.',
                    role: 'Transactional email delivery',
                    data: 'Recipient email address, email content (message preview, listing link)',
                    link: 'https://resend.com/legal/privacy-policy',
                    location: 'United States',
                  },
                  {
                    name: 'Netlify, Inc.',
                    role: 'Web hosting and CDN',
                    data: 'IP addresses, request logs, browser/device metadata',
                    link: 'https://www.netlify.com/privacy/',
                    location: 'United States',
                  },
                  {
                    name: 'Google LLC',
                    role: 'Advertising (AdSense)',
                    data: 'Cookies, browsing behavior, approximate location (city-level)',
                    link: 'https://policies.google.com/privacy',
                    location: 'United States and globally',
                  },
                  {
                    name: 'CARTO / OpenStreetMap contributors',
                    role: 'Map tile rendering',
                    data: 'IP address (standard server log for tile requests)',
                    link: 'https://carto.com/privacy/',
                    location: 'United States / EU',
                  },
                  {
                    name: 'NOAA / National Weather Service',
                    role: 'Emergency weather alerts',
                    data: 'No personal data — county code only',
                    link: 'https://www.weather.gov/',
                    location: 'United States (federal agency)',
                  },
                ].map((p) => (
                  <div key={p.name} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.role} &nbsp;·&nbsp; {p.location}</p>
                      </div>
                      <a href={p.link} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-water-700 underline shrink-0">
                        Privacy policy ↗
                      </a>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Data shared:</strong> {p.data}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 6 ── */}
            <section id="information-sharing">
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. Information Sharing</h2>
              <p className="mb-3">
                <strong>We do not sell your personal information.</strong> We share information
                only in the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Service providers</strong> — with the third-party processors listed in
                  Section 5, solely to provide the Service.</li>
                <li><strong>Other users</strong> — your display name, profile bio, lake name, and
                  any content you post publicly (feed posts, marketplace listings) are visible to
                  all authenticated users. Private messages are visible only to the conversation
                  participants.</li>
                <li><strong>Legal requirements</strong> — when required by law, court order,
                  subpoena, or governmental authority, or when we believe disclosure is necessary
                  to protect our rights, your safety, or the safety of others.</li>
                <li><strong>Business transfers</strong> — in connection with a merger, acquisition,
                  or sale of all or part of our assets, provided the acquiring party agrees to
                  honor this Privacy Policy.</li>
              </ul>
            </section>

            {/* ── 7 ── */}
            <section id="data-retention">
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account and profile data</strong> — retained while your account is
                  active. Deleted within 30 days of an account-deletion request.</li>
                <li><strong>Listings</strong> — retained until you delete them or close your
                  account. Sold/rented listings remain visible to conversation participants for
                  record-keeping purposes.</li>
                <li><strong>Messages</strong> — retained indefinitely unless you delete your
                  account, at which point conversation records are deleted.</li>
                <li><strong>Posts</strong> — retained until you delete the post or your account.</li>
                <li><strong>Server logs</strong> — Netlify retains access logs for up to 30 days
                  per their standard retention policy.</li>
                <li><strong>Advertising data</strong> — Google retains advertising-related data
                  per their own{' '}
                  <a href="https://policies.google.com/technologies/retention" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">
                    data retention schedule
                  </a>.</li>
              </ul>
            </section>

            {/* ── 8 ── */}
            <section id="your-rights">
              <h2 className="text-xl font-bold text-gray-900 mb-4">8. Your Rights &amp; Choices</h2>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong>Access and correction</strong> — you can view and edit your profile
                  information at any time from your{' '}
                  <Link href="/profile" className="text-water-700 underline">Profile</Link> page.
                </li>
                <li>
                  <strong>Account deletion</strong> — email us at{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-water-700 underline">{CONTACT_EMAIL}</a>{' '}
                  to request account deletion. We will process your request within 30 days.
                </li>
                <li>
                  <strong>Content deletion</strong> — you may delete your own posts and listings
                  at any time using the delete option within the platform.
                </li>
                <li>
                  <strong>Opt out of personalized ads</strong> — visit{' '}
                  <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">
                    Google Ads Settings
                  </a>{' '}
                  or{' '}
                  <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">
                    DAA opt-out
                  </a>{' '}
                  (Digital Advertising Alliance) or{' '}
                  <a href="https://www.networkadvertising.org/managing/opt_out.asp" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">
                    NAI opt-out
                  </a>.
                </li>
                <li>
                  <strong>Browser Do Not Track</strong> — our Service does not currently respond
                  to browser Do Not Track signals; however, you may use the opt-out links above
                  to control personalized advertising.
                </li>
              </ul>
            </section>

            {/* ── 9 ── */}
            <section id="michigan-residents">
              <h2 className="text-xl font-bold text-gray-900 mb-4">9. Michigan Residents</h2>

              <h3 className="font-semibold text-gray-900 mb-2">
                Michigan Identity Theft Protection Act (PA 452 of 2004)
              </h3>
              <p className="mb-3">
                Under Michigan Public Act 452 of 2004 (MCL 445.63 <em>et seq.</em>), we are
                required to notify Michigan residents in the event of a security breach that
                compromises &ldquo;personal information&rdquo; as defined by the Act — specifically,
                a person&rsquo;s first name or initial and last name combined with one or more of:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Social Security number</li>
                <li>Driver&rsquo;s license or Michigan Personal ID card number</li>
                <li>Financial account number combined with a security code, access code, or
                  password that permits access to the account</li>
              </ul>
              <p className="mb-3">
                <strong>We do not collect Social Security numbers, driver&rsquo;s license
                numbers, or financial account numbers.</strong> Our Service does not process
                payment information directly — any future payment features will use a PCI-compliant
                processor (e.g., Stripe) that handles financial data independently.
              </p>
              <p className="mb-3">
                In the event of a data breach affecting any personal information we do hold
                (name + email address), we will notify affected Michigan residents in the most
                expedient time possible and without unreasonable delay, as required by MCL
                445.72. Notification will be provided via email to the address on your account
                or, if email is impractical, by substitute notice methods specified in the Act.
              </p>

              <h3 className="font-semibold text-gray-900 mb-2 mt-5">Michigan Consumer Protection Act</h3>
              <p>
                We do not engage in unfair, unconscionable, or deceptive acts or practices in
                connection with our Service. If you believe we have violated the Michigan
                Consumer Protection Act, you may contact the Michigan Attorney General&rsquo;s
                Consumer Protection Division at{' '}
                <a href="https://www.michigan.gov/ag/consumer-protection" target="_blank" rel="noopener noreferrer" className="text-water-700 underline">
                  michigan.gov/ag/consumer-protection
                </a>.
              </p>
            </section>

            {/* ── 10 ── */}
            <section id="california-residents">
              <h2 className="text-xl font-bold text-gray-900 mb-4">10. California Residents (CCPA / CPRA)</h2>
              <p className="mb-3">
                If you are a California resident, the California Consumer Privacy Act (CCPA) as
                amended by the California Privacy Rights Act (CPRA) grants you the following
                rights:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Right to Know</strong> — the categories and specific pieces of personal
                  information we collect about you and how we use and share it.</li>
                <li><strong>Right to Delete</strong> — request deletion of personal information
                  we have collected from you, subject to certain exceptions.</li>
                <li><strong>Right to Correct</strong> — request correction of inaccurate
                  personal information.</li>
                <li><strong>Right to Opt Out of Sale or Sharing</strong> — we <strong>do not
                  sell</strong> personal information. We do share limited data with Google
                  AdSense for advertising purposes; you may opt out via the Google Ads Settings
                  link in Section 4.</li>
                <li><strong>Right to Non-Discrimination</strong> — we will not discriminate
                  against you for exercising any CCPA right.</li>
              </ul>
              <p>
                To exercise your California rights, email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-water-700 underline">{CONTACT_EMAIL}</a>{' '}
                with the subject line &ldquo;California Privacy Request.&rdquo; We will respond
                within 45 days of receipt.
              </p>
            </section>

            {/* ── 11 ── */}
            <section id="childrens-privacy">
              <h2 className="text-xl font-bold text-gray-900 mb-4">11. Children&rsquo;s Privacy</h2>
              <p>
                The Service is not directed to children under 13 years of age, and we do not
                knowingly collect personal information from children under 13. If you are a
                parent or guardian and believe your child has provided us with personal
                information, please contact us at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-water-700 underline">{CONTACT_EMAIL}</a>{' '}
                and we will delete that information promptly. If we become aware that we have
                collected personal information from a child under 13 without parental consent,
                we will take steps to remove that information from our systems.
              </p>
            </section>

            {/* ── 12 ── */}
            <section id="data-security">
              <h2 className="text-xl font-bold text-gray-900 mb-4">12. Data Security</h2>
              <p className="mb-3">
                We implement reasonable technical and organizational measures to protect your
                personal information, including:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>All data is transmitted over HTTPS/TLS.</li>
                <li>Passwords are never stored in plaintext; Supabase Auth stores bcrypt-hashed
                  password verifiers.</li>
                <li>Database access is controlled by Row-Level Security (RLS) policies — each user
                  can read and modify only their own data.</li>
                <li>Private messages are accessible only to the sender and recipient at the
                  database-policy level.</li>
                <li>Our service-role database key (used only in server-side API routes) is never
                  exposed to the client or included in public code.</li>
              </ul>
              <p>
                No method of electronic transmission or storage is 100% secure. While we strive
                to use commercially acceptable means to protect your personal information, we
                cannot guarantee its absolute security. In the event of a breach affecting
                personal information, we will notify affected users as described in Section 9.
              </p>
            </section>

            {/* ── 13 ── */}
            <section id="changes">
              <h2 className="text-xl font-bold text-gray-900 mb-4">13. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we make material
                changes we will update the effective date at the top of this page and, where
                required by law or where we deem appropriate, notify you by email at the address
                on file. We encourage you to review this page periodically. Your continued use
                of the Service after the effective date of any changes constitutes your
                acceptance of the revised policy.
              </p>
            </section>

            {/* ── 14 ── */}
            <section id="contact">
              <h2 className="text-xl font-bold text-gray-900 mb-4">14. Contact Us</h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our
                data practices, please contact us:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-1">{SITE_NAME}</p>
                <p className="text-gray-700">
                  Email:{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-water-700 underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p className="text-gray-700">
                  Website:{' '}
                  <a href={SITE_URL} className="text-water-700 underline">{SITE_URL}</a>
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  We aim to respond to all privacy-related inquiries within 5 business days.
                  For deletion or access requests we will respond within 30 days (45 days for
                  California residents).
                </p>
              </div>
            </section>

            {/* Footer note */}
            <div className="pt-6 border-t border-gray-200 text-sm text-gray-400">
              <p>
                This policy was last reviewed and updated on <strong>{EFFECTIVE_DATE}</strong>.
                &nbsp;·&nbsp;{' '}
                <Link href="/sign-in" className="text-water-700 hover:underline">Sign in</Link>
                {' '}&nbsp;·&nbsp;{' '}
                <Link href="/" className="text-water-700 hover:underline">Home</Link>
              </p>
            </div>

          </article>
        </div>
      </main>
    </div>
  )
}
