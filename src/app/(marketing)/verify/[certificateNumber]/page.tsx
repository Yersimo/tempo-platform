'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, XCircle, Award, ExternalLink, Linkedin, Loader2 } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface VerifiedCertificate {
  participantName: string
  academyName: string
  academyLogoUrl: string | null
  academyBrandColor: string
  certificateName: string
  issuedAt: string | null
  certificateNumber: string
  status: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getLinkedInShareUrl(verificationUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function CertificateVerifyPage() {
  const params = useParams()
  const certificateNumber = params.certificateNumber as string

  const [cert, setCert] = useState<VerifiedCertificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!certificateNumber) return

    // Set OG meta tags dynamically (for client-side rendering)
    async function fetchCertificate() {
      try {
        const res = await fetch(`/api/academy/certificate?action=verify&certificateNumber=${encodeURIComponent(certificateNumber)}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const json = await res.json()
        if (json.data) {
          setCert(json.data)
          // Update document title
          document.title = `${json.data.participantName} - ${json.data.certificateName} | Tempo Academy`
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchCertificate()
  }, [certificateNumber])

  // Update OG meta tags when cert data loads
  useEffect(() => {
    if (!cert) return
    const updateMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    updateMeta('og:title', `${cert.participantName} earned ${cert.certificateName}`)
    updateMeta('og:description', `Verified certificate from ${cert.academyName} via Tempo Academy`)
    updateMeta('og:image', cert.academyLogoUrl || 'https://theworktempo.com/tempo-logo.png')
    updateMeta('og:url', `https://theworktempo.com/verify/${cert.certificateNumber}`)
    updateMeta('og:type', 'website')
  }, [cert])

  const verificationUrl = `https://theworktempo.com/verify/${certificateNumber}`

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  if (notFound || !cert) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
            <p className="text-sm text-gray-500 mb-4">
              The certificate number <span className="font-mono font-medium text-gray-700">{certificateNumber}</span> could not be verified.
              Please check the number and try again.
            </p>
            <div className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
              Verified by Tempo Academy |{' '}
              <a href="https://theworktempo.com" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                theworktempo.com
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const brandColor = cert.academyBrandColor || '#2563eb'
  const isEarned = cert.status === 'earned'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Brand color accent bar */}
          <div className="h-2" style={{ backgroundColor: brandColor }} />

          <div className="p-8">
            {/* Academy header */}
            <div className="flex items-center gap-3 mb-6">
              {cert.academyLogoUrl ? (
                <img
                  src={cert.academyLogoUrl}
                  alt={cert.academyName}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  {cert.academyName.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{cert.academyName}</h2>
                <p className="text-xs text-gray-500">Academy Certificate</p>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex justify-center mb-6">
              {isEarned ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Verified</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
                  <Award size={18} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">In Progress</span>
                </div>
              )}
            </div>

            {/* Certificate details */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${brandColor}15` }}>
                <Award size={28} style={{ color: brandColor }} />
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">{cert.certificateName}</h1>
              <p className="text-base text-gray-700">Awarded to</p>
              <p className="text-xl font-bold mt-1" style={{ color: brandColor }}>{cert.participantName}</p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-400 mb-0.5">Certificate Number</p>
                <p className="text-xs font-mono font-semibold text-gray-700">{cert.certificateNumber}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-400 mb-0.5">Issue Date</p>
                <p className="text-xs font-semibold text-gray-700">{cert.issuedAt ? formatDate(cert.issuedAt) : 'Pending'}</p>
              </div>
            </div>

            {/* LinkedIn Share Button */}
            {isEarned && (
              <div className="flex justify-center mb-6">
                <a
                  href={getLinkedInShareUrl(verificationUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#0A66C2' }}
                >
                  <Linkedin size={16} />
                  Share on LinkedIn
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50 text-center">
            <p className="text-xs text-gray-400">
              Verified by Tempo Academy |{' '}
              <a
                href="https://theworktempo.com"
                className="text-blue-500 hover:underline inline-flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                theworktempo.com <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
