import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Slack URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    // Verify the request is from Slack
    const signingSecret = process.env.SLACK_SIGNING_SECRET
    if (signingSecret) {
      // In production, verify the X-Slack-Signature header
      // For now, we accept all events
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
          // Bot was mentioned in a channel
          break
        case 'message':
          // Message in a channel the bot is in
          break
        case 'team_join':
          // New user joined the workspace
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
