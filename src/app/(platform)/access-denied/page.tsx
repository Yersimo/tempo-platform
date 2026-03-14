'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { ShieldX, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'

function AccessDeniedContent() {
  const searchParams = useSearchParams()
  const requiredPermission = searchParams.get('permission')
  const attemptedPath = searchParams.get('path')

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldX size={40} className="text-red-400" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-t1">Access Denied</h1>
          <p className="text-t3 text-sm leading-relaxed">
            You don&apos;t have permission to access this page.
            Contact your administrator to request access.
          </p>
        </div>

        {/* Detail */}
        {(requiredPermission || attemptedPath) && (
          <div className="bg-surface-secondary rounded-lg p-4 text-left space-y-2">
            {attemptedPath && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-t3 w-20 shrink-0">Page</span>
                <code className="text-t2 font-mono bg-surface-tertiary px-2 py-0.5 rounded">
                  {attemptedPath}
                </code>
              </div>
            )}
            {requiredPermission && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-t3 w-20 shrink-0">Requires</span>
                <code className="text-t2 font-mono bg-surface-tertiary px-2 py-0.5 rounded">
                  {requiredPermission}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="primary" size="sm">
              <ArrowLeft size={14} className="mr-1.5" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/help">
            <Button variant="outline" size="sm">
              <Mail size={14} className="mr-1.5" />
              Get Help
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AccessDeniedPage() {
  return (
    <>
      <Header title="Access Denied" />
      <Suspense fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-surface-secondary animate-pulse" />
        </div>
      }>
        <AccessDeniedContent />
      </Suspense>
    </>
  )
}
