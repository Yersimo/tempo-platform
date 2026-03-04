import { NextRequest } from 'next/server'
import { subscribe } from '@/lib/services/chat-broadcaster'

// GET /api/chat/stream?employeeId=X&channels=ch-1,ch-2,...
// Returns text/event-stream for real-time chat updates
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const orgId = request.headers.get('x-org-id')
  const employeeId = url.searchParams.get('employeeId')
  const channelsParam = url.searchParams.get('channels') || ''

  if (!orgId || !employeeId) {
    return new Response('Missing orgId or employeeId', { status: 400 })
  }

  const channelIds = channelsParam.split(',').filter(Boolean)

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      function send(eventType: string, data: any) {
        try {
          controller.enqueue(encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch { /* stream closed */ }
      }

      // Send initial connection event
      send('connected', { employeeId, channels: channelIds, timestamp: Date.now() })

      // Subscribe to chat events
      const unsubscribe = subscribe(employeeId, channelIds, (event) => {
        send(event.type, event.data)
      })

      // Heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 15000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe()
        clearInterval(heartbeat)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
