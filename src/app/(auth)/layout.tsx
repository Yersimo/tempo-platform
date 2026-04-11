'use client'

import { TempoProvider } from '@/lib/store'
import { Shield } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <TempoProvider>
      <div className="min-h-screen flex">
        {/* Left: Brand Panel */}
        <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between bg-[#0f0f0f] relative overflow-hidden">
          {/* Subtle radial glows */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(232,89,12,0.07),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(232,89,12,0.04),transparent_50%)]" />
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

          {/* Top: Logo — text wordmark only, matching landing page */}
          <div className="relative z-10 px-10 pt-10">
            <span className="font-bold text-[22px] tracking-[-0.02em] text-white">
              tempo<span className="text-[#00897B]">.</span>
            </span>
          </div>

          {/* Center: Hero */}
          <div className="relative z-10 px-10 flex-1 flex flex-col justify-center">
            <h1 className="text-[34px] xl:text-[38px] font-semibold text-white leading-[1.15] tracking-[-0.025em]">
              The workforce<br />
              platform built<br />
              for scale.
            </h1>
            <p className="text-[14px] text-white/35 mt-5 leading-[1.7] max-w-[320px]">
              Payroll, people, compliance, and benefits — unified across every country you operate in.
            </p>

            {/* Trust badge */}
            <div className="flex items-center gap-2 mt-8 text-white/20">
              <Shield size={14} />
              <span className="text-[11px] uppercase tracking-[0.08em]">SOC 2 Compliant &middot; GDPR Ready</span>
            </div>
          </div>

          {/* Bottom: Stats */}
          <div className="relative z-10 px-10 pb-10">
            <div className="border-t border-white/[0.06] pt-8">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[22px] font-semibold text-white tabular-nums tracking-tight">50K+</p>
                  <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.1em]">Employees</p>
                </div>
                <div className="w-px h-9 bg-white/[0.06]" />
                <div>
                  <p className="text-[22px] font-semibold text-white tabular-nums tracking-tight">80+</p>
                  <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.1em]">Countries</p>
                </div>
                <div className="w-px h-9 bg-white/[0.06]" />
                <div>
                  <p className="text-[22px] font-semibold text-white tabular-nums tracking-tight">99.9%</p>
                  <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.1em]">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form area */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#fafafa]">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>
      </div>
    </TempoProvider>
  )
}
