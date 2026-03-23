import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

interface DemoRequestBody {
  fullName: string
  email: string
  companyName: string
  jobTitle?: string
  companySize: string
  country: string
  modules?: string[]
  timeline: string
  message?: string
}

const SALES_EMAIL = 'admin@theworktempo.com'

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const body: DemoRequestBody = await req.json()

    // Validate required fields
    if (!body.fullName?.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    if (!body.email?.trim() || !validateEmail(body.email)) {
      return NextResponse.json({ error: 'A valid work email is required' }, { status: 400 })
    }
    if (!body.companyName?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }
    if (!body.companySize?.trim()) {
      return NextResponse.json({ error: 'Company size is required' }, { status: 400 })
    }
    if (!body.country?.trim()) {
      return NextResponse.json({ error: 'Country is required' }, { status: 400 })
    }
    if (!body.timeline?.trim()) {
      return NextResponse.json({ error: 'Timeline is required' }, { status: 400 })
    }

    const name = body.fullName.trim()
    const companyName = body.companyName.trim()
    const modulesText = body.modules?.length ? body.modules.join(', ') : 'Not specified'

    // 1. Send auto-response to the requester
    const autoResponseHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f1117;padding:24px 32px">
      <span style="color:#ea580c;font-size:20px;font-weight:700;letter-spacing:-0.02em">tempo<span style="color:#ea580c">.</span></span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Thank you for your interest, ${name}!</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
        We've received your demo request and our team will reach out within 24 hours to schedule your personalized walkthrough.
      </p>
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#333">What to expect:</p>
      <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#555;line-height:1.8">
        <li>A 30-minute personalized demo tailored to ${companyName}'s needs</li>
        <li>Deep dive into the modules you're interested in</li>
        <li>Q&A with our product team</li>
        <li>Custom ROI analysis for your organization</li>
      </ul>
      <p style="margin:0 0 20px;font-size:14px;color:#555">In the meantime, feel free to explore our platform:</p>
      <a href="https://theworktempo.com" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Visit Tempo</a>
      <hr style="margin:30px 0;border:none;border-top:1px solid #eee">
      <p style="color:#999;font-size:12px;margin:0">This email was sent by Tempo (theworktempo.com). If you didn't request a demo, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`

    // 2. Send notification to sales team
    const salesNotificationHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f1117;padding:24px 32px;display:flex;justify-content:space-between;align-items:center">
      <span style="color:#ea580c;font-size:20px;font-weight:700;letter-spacing:-0.02em">tempo<span style="color:#ea580c">.</span></span>
      <span style="color:rgba(255,255,255,.3);font-size:12px">New Demo Request</span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#111">New Demo Request</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0;width:140px">Name</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0">${name}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0">Email</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0"><a href="mailto:${body.email}" style="color:#ea580c">${body.email}</a></td></tr>
        <tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0">Company</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0">${companyName}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0">Job Title</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0">${body.jobTitle || 'Not specified'}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0">Company Size</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0">${body.companySize}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0">Country</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0">${body.country}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0">Modules</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0">${modulesText}</td></tr>
        <tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0">Timeline</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0">${body.timeline}</td></tr>
        ${body.message ? `<tr><td style="padding:8px 12px;color:#666;font-weight:500;border-bottom:1px solid #f0f0f0">Message</td><td style="padding:8px 12px;color:#111;border-bottom:1px solid #f0f0f0">${body.message}</td></tr>` : ''}
      </table>
      <div style="margin-top:24px">
        <a href="mailto:${body.email}" style="display:inline-block;background:#ea580c;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">Reply to ${name}</a>
      </div>
    </div>
  </div>
</body>
</html>`

    // Send both emails (fire and forget)
    const emailPromises = [
      sendEmail(body.email, `Your Demo Request - Tempo`, autoResponseHTML),
      sendEmail(SALES_EMAIL, `New Demo Request: ${name} from ${companyName}`, salesNotificationHTML),
    ]

    // We don't block on email delivery
    Promise.allSettled(emailPromises).then((results) => {
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`[Demo Request] Email ${i} failed:`, result.reason)
        }
      })
    })

    console.log(`[Demo Request] ${name} (${body.email}) from ${companyName} - ${body.companySize} - ${body.country} - Timeline: ${body.timeline}`)

    return NextResponse.json({ success: true, message: 'Demo request received' })
  } catch (error) {
    console.error('[Demo Request] Error:', error)
    return NextResponse.json({ error: 'Failed to process demo request' }, { status: 500 })
  }
}
