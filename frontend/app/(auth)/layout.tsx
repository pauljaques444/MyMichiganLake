const RIPPLES = [
  { top: '58%', mx: '10%', delay: '0s',   dur: '3.0s' },
  { top: '68%', mx: '18%', delay: '0.6s', dur: '3.5s' },
  { top: '78%', mx: '26%', delay: '1.2s', dur: '2.9s' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10">

      {/* Sky → water gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #87BDDF 0%, #4A98C9 20%, #2B78BF 36%, #1a62d2 50%, #1c4faa 66%, #132f72 82%, #0a1e48 100%)',
      }} />

      {/* Shimmer on water */}
      <div
        className="absolute inset-x-0"
        style={{
          top: '50%', bottom: 0,
          background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.09) 50%, transparent 75%)',
          backgroundSize: '300% 100%',
          animation: 'lake-shimmer 9s linear infinite',
        }}
      />

      {/* Horizon glow */}
      <div className="absolute inset-x-0" style={{
        top: '48.5%',
        height: '3px',
        background: 'linear-gradient(90deg, transparent 5%, rgba(240,190,70,0.55) 30%, rgba(255,215,90,0.85) 50%, rgba(240,190,70,0.55) 70%, transparent 95%)',
      }} />

      {/* Treeline */}
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

      {/* Ripple lines */}
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

      {/* Auth card (children) */}
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
