export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('/michigan-lake.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark vignette overlay for card readability */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 100%)',
      }} />

      {/* Auth card (children) */}
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
