'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Shield, ShieldCheck, ShieldOff, Copy, Check, RefreshCw, KeyRound } from 'lucide-react'

interface MFAStatus {
  enabled: boolean
  method: string | null
  enrolledAt: string | null
  lastUsedAt: string | null
}

export function MFASettings() {
  const t = useTranslations('security')
  const [status, setStatus] = useState<MFAStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // Enrollment flow
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollStep, setEnrollStep] = useState<'setup' | 'verify' | 'done'>('setup')
  const [secret, setSecret] = useState('')
  const [otpAuthUri, setOtpAuthUri] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verifyCode, setVerifyCode] = useState('')
  const [enrollError, setEnrollError] = useState('')
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Disable flow
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [disableError, setDisableError] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)

  // Regenerate backup codes
  const [showRegenModal, setShowRegenModal] = useState(false)
  const [regenPassword, setRegenPassword] = useState('')
  const [regenError, setRegenError] = useState('')
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenCodes, setRegenCodes] = useState<string[]>([])

  const verifyInputRef = useRef<HTMLInputElement>(null)

  // Fetch MFA status on mount
  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  // ─── Enroll ────────────────────────────────────────────────────
  async function startEnrollment() {
    setEnrollLoading(true)
    setEnrollError('')
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll' }),
      })
      if (res.ok) {
        const data = await res.json()
        setSecret(data.secret)
        setOtpAuthUri(data.otpAuthUri)
        setBackupCodes(data.backupCodes)
        setEnrollStep('setup')
        setShowEnrollModal(true)
      } else {
        const err = await res.json()
        setEnrollError(err.error || t('enrollFailed'))
      }
    } catch {
      setEnrollError(t('enrollFailed'))
    }
    setEnrollLoading(false)
  }

  async function verifyEnrollment() {
    if (verifyCode.length !== 6) return
    setEnrollLoading(true)
    setEnrollError('')
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_enrollment', code: verifyCode }),
      })
      if (res.ok) {
        setEnrollStep('done')
        fetchStatus()
      } else {
        const err = await res.json()
        setEnrollError(err.error || t('invalidCode'))
        setVerifyCode('')
      }
    } catch {
      setEnrollError(t('verifyFailed'))
    }
    setEnrollLoading(false)
  }

  function closeEnrollModal() {
    setShowEnrollModal(false)
    setEnrollStep('setup')
    setSecret('')
    setOtpAuthUri('')
    setBackupCodes([])
    setVerifyCode('')
    setEnrollError('')
    setCopiedSecret(false)
    setCopiedCodes(false)
  }

  // ─── Disable ───────────────────────────────────────────────────
  async function disableMFA() {
    if (!disablePassword) return
    setDisableLoading(true)
    setDisableError('')
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', password: disablePassword }),
      })
      if (res.ok) {
        setShowDisableModal(false)
        setDisablePassword('')
        fetchStatus()
      } else {
        const err = await res.json()
        setDisableError(err.error || t('disableFailed'))
      }
    } catch {
      setDisableError(t('disableFailed'))
    }
    setDisableLoading(false)
  }

  // ─── Regenerate Backup Codes ───────────────────────────────────
  async function regenerateBackupCodes() {
    if (!regenPassword) return
    setRegenLoading(true)
    setRegenError('')
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup_codes', password: regenPassword }),
      })
      if (res.ok) {
        const data = await res.json()
        setRegenCodes(data.backupCodes)
        setRegenPassword('')
      } else {
        const err = await res.json()
        setRegenError(err.error || t('regenFailed'))
      }
    } catch {
      setRegenError(t('regenFailed'))
    }
    setRegenLoading(false)
  }

  // ─── Copy Helpers ──────────────────────────────────────────────
  function copyToClipboard(text: string, type: 'secret' | 'codes') {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'secret') {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      } else {
        setCopiedCodes(true)
        setTimeout(() => setCopiedCodes(false), 2000)
      }
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-canvas rounded w-1/3" />
        <div className="h-10 bg-canvas rounded" />
      </div>
    )
  }

  return (
    <div>
      {/* MFA Status Card */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
          <Shield size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-t1">{t('mfaTitle')}</h3>
          <p className="text-xs text-t3">{t('mfaDescription')}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            {status?.enabled ? (
              <ShieldCheck size={18} className="text-green-600" />
            ) : (
              <ShieldOff size={18} className="text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-t1">
                {t('totpLabel')}
              </p>
              <p className="text-xs text-t3">
                {status?.enabled ? t('mfaEnabledDesc') : t('mfaDisabledDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status?.enabled ? 'success' : 'default'}>
              {status?.enabled ? t('enabled') : t('disabled')}
            </Badge>
            {status?.enabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setDisablePassword(''); setDisableError(''); setShowDisableModal(true) }}
              >
                {t('disableMFA')}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={startEnrollment}
                disabled={enrollLoading}
              >
                {enrollLoading ? t('settingUp') : t('enableMFA')}
              </Button>
            )}
          </div>
        </div>

        {status?.enabled && (
          <div className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <KeyRound size={18} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-t1">{t('backupCodesLabel')}</p>
                <p className="text-xs text-t3">{t('backupCodesDesc')}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRegenPassword(''); setRegenError(''); setRegenCodes([]); setShowRegenModal(true) }}
            >
              <RefreshCw size={14} />
              {t('regenerate')}
            </Button>
          </div>
        )}

        {status?.enabled && status.lastUsedAt && (
          <p className="text-xs text-t3 px-1">
            {t('lastUsed', { date: new Date(status.lastUsedAt).toLocaleDateString() })}
          </p>
        )}
      </div>

      {enrollError && !showEnrollModal && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{enrollError}</p>
      )}

      {/* ─── Enrollment Modal ─────────────────────────────────────── */}
      <Modal
        open={showEnrollModal}
        onClose={closeEnrollModal}
        title={enrollStep === 'done' ? t('mfaSetupComplete') : t('mfaSetup')}
        size="md"
      >
        {enrollStep === 'setup' && (
          <div className="space-y-5">
            <p className="text-sm text-t2">{t('setupInstructions')}</p>

            {/* Manual entry secret */}
            <div>
              <label className="block text-xs font-medium text-t1 mb-1.5">{t('manualEntry')}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-canvas border border-divider rounded-lg px-3 py-2 text-sm font-mono text-t1 select-all break-all">
                  {secret}
                </code>
                <button
                  onClick={() => copyToClipboard(secret, 'secret')}
                  className="flex-shrink-0 p-2 rounded-lg border border-divider hover:bg-canvas transition-colors"
                  title={t('copySecret')}
                >
                  {copiedSecret ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-t3" />}
                </button>
              </div>
            </div>

            {/* OTP Auth URI */}
            <div>
              <label className="block text-xs font-medium text-t1 mb-1.5">{t('otpAuthUri')}</label>
              <code className="block bg-canvas border border-divider rounded-lg px-3 py-2 text-[0.65rem] font-mono text-t3 break-all select-all">
                {otpAuthUri}
              </code>
              <p className="text-[0.6rem] text-t3 mt-1">{t('otpAuthUriHint')}</p>
            </div>

            {/* Backup codes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-t1">{t('backupCodes')}</label>
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                  className="flex items-center gap-1 text-[0.65rem] text-tempo-600 hover:text-tempo-700 transition-colors"
                >
                  {copiedCodes ? <Check size={12} /> : <Copy size={12} />}
                  {copiedCodes ? t('copied') : t('copyAll')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-canvas border border-divider rounded-lg p-3">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-xs font-mono text-t1 px-2 py-1 bg-white rounded border border-divider text-center">
                    {code}
                  </code>
                ))}
              </div>
              <p className="text-[0.6rem] text-red-600 mt-1.5 font-medium">{t('saveBackupCodesWarning')}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeEnrollModal}>{t('cancel')}</Button>
              <Button onClick={() => { setEnrollStep('verify'); setTimeout(() => verifyInputRef.current?.focus(), 100) }}>
                {t('continueToVerify')}
              </Button>
            </div>
          </div>
        )}

        {enrollStep === 'verify' && (
          <div className="space-y-5">
            <p className="text-sm text-t2">{t('verifyInstructions')}</p>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1.5">{t('verificationCode')}</label>
              <input
                ref={verifyInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2.5 text-center text-lg font-mono font-semibold bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600 tracking-[0.3em]"
                disabled={enrollLoading}
              />
            </div>

            {enrollError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{enrollError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setEnrollStep('setup'); setVerifyCode(''); setEnrollError('') }}>
                {t('back')}
              </Button>
              <Button onClick={verifyEnrollment} disabled={enrollLoading || verifyCode.length !== 6}>
                {enrollLoading ? t('verifying') : t('verifyAndEnable')}
              </Button>
            </div>
          </div>
        )}

        {enrollStep === 'done' && (
          <div className="space-y-5 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <ShieldCheck size={28} className="text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-t1 mb-1">{t('mfaActivated')}</h3>
              <p className="text-sm text-t3">{t('mfaActivatedDesc')}</p>
            </div>
            <Button onClick={closeEnrollModal} className="w-full">{t('done')}</Button>
          </div>
        )}
      </Modal>

      {/* ─── Disable Modal ────────────────────────────────────────── */}
      <Modal
        open={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        title={t('disableMFATitle')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-t2">{t('disableMFAWarning')}</p>

          <div>
            <label className="block text-xs font-medium text-t1 mb-1">{t('confirmPassword')}</label>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder={t('enterPassword')}
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              autoFocus
            />
          </div>

          {disableError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{disableError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDisableModal(false)}>{t('cancel')}</Button>
            <Button variant="danger" onClick={disableMFA} disabled={disableLoading || !disablePassword}>
              {disableLoading ? t('disabling') : t('disableMFA')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Regenerate Backup Codes Modal ─────────────────────────── */}
      <Modal
        open={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        title={t('regenerateBackupCodes')}
        size="sm"
      >
        <div className="space-y-4">
          {regenCodes.length === 0 ? (
            <>
              <p className="text-sm text-t2">{t('regenWarning')}</p>

              <div>
                <label className="block text-xs font-medium text-t1 mb-1">{t('confirmPassword')}</label>
                <input
                  type="password"
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  placeholder={t('enterPassword')}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  autoFocus
                />
              </div>

              {regenError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{regenError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowRegenModal(false)}>{t('cancel')}</Button>
                <Button onClick={regenerateBackupCodes} disabled={regenLoading || !regenPassword}>
                  {regenLoading ? t('regenerating') : t('regenerate')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-t2">{t('newBackupCodes')}</p>
              <div className="grid grid-cols-2 gap-1.5 bg-canvas border border-divider rounded-lg p-3">
                {regenCodes.map((code, i) => (
                  <code key={i} className="text-xs font-mono text-t1 px-2 py-1 bg-white rounded border border-divider text-center">
                    {code}
                  </code>
                ))}
              </div>
              <p className="text-[0.6rem] text-red-600 font-medium">{t('saveBackupCodesWarning')}</p>
              <Button onClick={() => setShowRegenModal(false)} className="w-full">{t('done')}</Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
