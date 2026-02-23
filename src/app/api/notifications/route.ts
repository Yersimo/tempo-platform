import { NextRequest, NextResponse } from 'next/server'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, sendNotification } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  const employeeId = request.headers.get('x-employee-id')
  const orgId = request.headers.get('x-org-id')

  if (!employeeId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'count') {
      const count = await getUnreadCount(employeeId)
      return NextResponse.json({ count })
    }

    const unreadOnly = url.searchParams.get('unread') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const notifications = await getNotifications(employeeId, { limit, unreadOnly })
    const unreadCount = await getUnreadCount(employeeId)

    return NextResponse.json({ notifications, unread_count: unreadCount })
  } catch (err) {
    console.error('Notifications GET error:', err)
    // Return empty notifications gracefully instead of crashing
    return NextResponse.json({ notifications: [], unread_count: 0 })
  }
}

export async function POST(request: NextRequest) {
  const employeeId = request.headers.get('x-employee-id')
  const orgId = request.headers.get('x-org-id')

  if (!employeeId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body

  if (action === 'mark_read') {
    const { notificationId } = body
    if (notificationId) {
      await markAsRead(notificationId)
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'mark_all_read') {
    await markAllAsRead(employeeId)
    return NextResponse.json({ success: true })
  }

  if (action === 'send') {
    // Only admins/owners can send notifications directly
    const role = request.headers.get('x-employee-role')
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await sendNotification({
      orgId,
      recipientId: body.recipientId,
      senderId: employeeId,
      type: body.type || 'info',
      channel: body.channel || 'in_app',
      title: body.title,
      message: body.message,
      link: body.link,
      entityType: body.entityType,
      entityId: body.entityId,
    })

    if (!result) {
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }

    return NextResponse.json({ notification: result }, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
