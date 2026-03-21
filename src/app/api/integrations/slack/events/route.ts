import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function verifySlackSignature(request: NextRequest, body: string): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) return true // Skip verification if no secret configured

  const timestamp = request.headers.get('x-slack-request-timestamp')
  const signature = request.headers.get('x-slack-signature')

  if (!timestamp || !signature) return false

  // Prevent replay attacks (5 minute window)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) return false

  const sigBasestring = `v0:${timestamp}:${body}`
  const hmac = crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex')
  const computed = `v0=${hmac}`

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  )
}

function handleAppMention(event: Record<string, unknown>, teamId: string) {
  console.log(`[Slack Events] App mentioned by user ${event.user} in channel ${event.channel}`, {
    team: teamId,
    text: event.text,
    ts: event.ts,
  })
}

function handleMessage(event: Record<string, unknown>, teamId: string) {
  // Ignore bot messages to avoid loops
  if (event.bot_id || event.subtype === 'bot_message') return

  console.log(`[Slack Events] Message in channel ${event.channel}`, {
    team: teamId,
    user: event.user,
    channel_type: event.channel_type,
    ts: event.ts,
  })
}

function handleTeamJoin(event: Record<string, unknown>, teamId: string) {
  const user = event.user as Record<string, unknown> | undefined
  const userId = user?.id ?? 'unknown'
  const userName = (user?.profile as Record<string, unknown>)?.real_name ?? 'unknown'

  console.log(`[Slack Events] New team member joined: ${userName} (${userId})`, {
    team: teamId,
  })

  // TODO: Trigger onboarding notification via notification service
  // e.g. notificationService.sendOnboardingWelcome(teamId, userId)
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text()

    // Verify the request is from Slack before processing
    if (!verifySlackSignature(request, rawBody)) {
      console.warn('[Slack Events] Invalid signature — rejecting request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    // Slack URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle events
    if (body.type === 'event_callback') {
      const event = body.event

      // Log the event (non-blocking)
      console.log(`[Slack Events] Received: ${event?.type}`, {
        team: body.team_id,
        event_type: event?.type,
      })

      // Handle specific events
      switch (event?.type) {
        case 'app_mention':
          handleAppMention(event, body.team_id)
          break
        case 'message':
          handleMessage(event, body.team_id)
          break
        case 'team_join':
          handleTeamJoin(event, body.team_id)
          break
        default:
          break
      }
    }

    // Always respond with 200 to acknowledge receipt
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Slack Events] Error:', error)
    // Still return 200 to prevent Slack from retrying
    return NextResponse.json({ ok: true })
  }
}
