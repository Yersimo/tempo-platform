import { TempoMark } from '@/components/brand/tempo-mark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-chrome flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12">
        <TempoMark variant="white" size={120} />
        <h1 className="tempo-wordmark text-4xl text-white mt-8">tempo</h1>
        <p className="text-white/30 text-sm mt-3 text-center max-w-sm">
          The unified workforce platform built for enterprise Africa
        </p>
        <div className="mt-12 grid grid-cols-2 gap-6 text-center">
          <div>
            <p className="tempo-stat text-2xl text-tempo-600">14,000+</p>
            <p className="text-xs text-white/20">Employees</p>
          </div>
          <div>
            <p className="tempo-stat text-2xl text-tempo-600">33</p>
            <p className="text-xs text-white/20">Countries</p>
          </div>
          <div>
            <p className="tempo-stat text-2xl text-tempo-600">16</p>
            <p className="text-xs text-white/20">Modules</p>
          </div>
          <div>
            <p className="tempo-stat text-2xl text-tempo-600">99.9%</p>
            <p className="text-xs text-white/20">Uptime</p>
          </div>
        </div>
      </div>
      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
