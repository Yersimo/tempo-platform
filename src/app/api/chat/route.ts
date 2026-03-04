import { NextRequest, NextResponse } from 'next/server'
import {
  createChannel,
  createAnnouncementChannel,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  pinMessage,
  createThread,
  addParticipant,
  removeParticipant,
  muteChannel,
  searchMessages,
  getUnreadCount,
  markAsRead,
  getChannelAnalytics,
  listChannels,
  getMessages,
} from '@/lib/services/chat-service'
import { broadcast } from '@/lib/services/chat-broadcaster'

// GET /api/chat - List channels, get messages, search, unread count, analytics
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'channels'
    const employeeId = url.searchParams.get('employeeId')

    if (!employeeId && action !== 'analytics') {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
    }

    switch (action) {
      case 'channels': {
        const type = url.searchParams.get('type') as any
        const result = await listChannels(orgId, employeeId!, type ? { type } : undefined)
        return NextResponse.json(result)
      }

      case 'messages': {
        const channelId = url.searchParams.get('channelId')
        if (!channelId) {
          return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
        }
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const before = url.searchParams.get('before') || undefined
        const threadId = url.searchParams.get('threadId') || undefined
        const result = await getMessages(orgId, channelId, employeeId!, { limit, before, threadId })
        return NextResponse.json(result)
      }

      case 'search': {
        const query = url.searchParams.get('query')
        if (!query) {
          return NextResponse.json({ error: 'query is required' }, { status: 400 })
        }
        const channelId = url.searchParams.get('channelId') || undefined
        const limit = parseInt(url.searchParams.get('limit') || '20')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const result = await searchMessages(orgId, employeeId!, query, { channelId, limit, offset })
        return NextResponse.json(result)
      }

      case 'unread': {
        const result = await getUnreadCount(orgId, employeeId!)
        return NextResponse.json(result)
      }

      case 'analytics': {
        const channelId = url.searchParams.get('channelId')
        if (!channelId) {
          return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
        }
        const result = await getChannelAnalytics(orgId, channelId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Chat operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/chat - Create channels, send messages, reactions, threads, participants
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-channel': {
        const { createdBy, name, description, type, departmentId, memberIds } = body
        if (!createdBy || !type || !memberIds?.length) {
          return NextResponse.json(
            { error: 'createdBy, type, and memberIds are required' },
            { status: 400 }
          )
        }
        const result = await createChannel(orgId, createdBy, {
          name,
          description,
          type,
          departmentId,
          memberIds,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'create-announcement': {
        const { createdBy, name, description, memberIds, adminIds } = body
        if (!createdBy || !name || !memberIds?.length) {
          return NextResponse.json(
            { error: 'createdBy, name, and memberIds are required' },
            { status: 400 }
          )
        }
        const result = await createAnnouncementChannel(
          orgId, createdBy, name, description, memberIds, adminIds || [createdBy]
        )
        return NextResponse.json(result, { status: 201 })
      }

      case 'send-message': {
        const { channelId, senderId, content, type, threadId, parentMessageId, fileUrl, fileName, fileSize, fileMimeType, mentions, metadata } = body
        if (!channelId || !senderId) {
          return NextResponse.json({ error: 'channelId and senderId are required' }, { status: 400 })
        }
        const result = await sendMessage(orgId, {
          channelId,
          senderId,
          content,
          type,
          threadId,
          parentMessageId,
          fileUrl,
          fileName,
          fileSize,
          fileMimeType,
          mentions,
          metadata,
        })
        broadcast(channelId, { type: 'message', data: result })
        return NextResponse.json(result, { status: 201 })
      }

      case 'create-thread': {
        const { parentMessageId, senderId, content } = body
        if (!parentMessageId || !senderId || !content) {
          return NextResponse.json(
            { error: 'parentMessageId, senderId, and content are required' },
            { status: 400 }
          )
        }
        const result = await createThread(orgId, parentMessageId, senderId, content)
        return NextResponse.json(result, { status: 201 })
      }

      case 'add-reaction': {
        const { messageId, channelId, employeeId, emoji } = body
        if (!messageId || !employeeId || !emoji) {
          return NextResponse.json(
            { error: 'messageId, employeeId, and emoji are required' },
            { status: 400 }
          )
        }
        const result = await addReaction(orgId, messageId, employeeId, emoji)
        if (channelId) {
          broadcast(channelId, { type: 'reaction', data: result })
        }
        return NextResponse.json(result)
      }

      case 'remove-reaction': {
        const { messageId, employeeId, emoji } = body
        if (!messageId || !employeeId || !emoji) {
          return NextResponse.json(
            { error: 'messageId, employeeId, and emoji are required' },
            { status: 400 }
          )
        }
        const result = await removeReaction(orgId, messageId, employeeId, emoji)
        return NextResponse.json(result)
      }

      case 'pin-message': {
        const { messageId, pinnedBy, pin } = body
        if (!messageId || !pinnedBy) {
          return NextResponse.json(
            { error: 'messageId and pinnedBy are required' },
            { status: 400 }
          )
        }
        const result = await pinMessage(orgId, messageId, pinnedBy, pin !== false)
        return NextResponse.json(result)
      }

      case 'add-participant': {
        const { channelId, employeeId, addedBy } = body
        if (!channelId || !employeeId || !addedBy) {
          return NextResponse.json(
            { error: 'channelId, employeeId, and addedBy are required' },
            { status: 400 }
          )
        }
        const result = await addParticipant(orgId, channelId, employeeId, addedBy)
        return NextResponse.json(result)
      }

      case 'remove-participant': {
        const { channelId, employeeId, removedBy } = body
        if (!channelId || !employeeId || !removedBy) {
          return NextResponse.json(
            { error: 'channelId, employeeId, and removedBy are required' },
            { status: 400 }
          )
        }
        const result = await removeParticipant(orgId, channelId, employeeId, removedBy)
        return NextResponse.json(result)
      }

      case 'mute-channel': {
        const { channelId, employeeId, mute } = body
        if (!channelId || !employeeId) {
          return NextResponse.json(
            { error: 'channelId and employeeId are required' },
            { status: 400 }
          )
        }
        const result = await muteChannel(orgId, channelId, employeeId, mute !== false)
        return NextResponse.json(result)
      }

      case 'mark-read': {
        const { channelId, employeeId } = body
        if (!channelId || !employeeId) {
          return NextResponse.json(
            { error: 'channelId and employeeId are required' },
            { status: 400 }
          )
        }
        const result = await markAsRead(orgId, channelId, employeeId)
        return NextResponse.json(result)
      }

      case 'typing': {
        const { channelId, employeeId } = body
        if (!channelId || !employeeId) {
          return NextResponse.json(
            { error: 'channelId and employeeId are required' },
            { status: 400 }
          )
        }
        broadcast(channelId, { type: 'typing', data: { employeeId, channelId } })
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Chat operation failed'
    const status = error instanceof Error && 'code' in error ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PUT /api/chat - Edit messages, update channels
export async function PUT(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'edit-message': {
        const { messageId, channelId, newContent, editorId } = body
        if (!messageId || !newContent || !editorId) {
          return NextResponse.json(
            { error: 'messageId, newContent, and editorId are required' },
            { status: 400 }
          )
        }
        const result = await editMessage(orgId, { messageId, newContent, editorId })
        if (channelId) {
          broadcast(channelId, { type: 'message', data: { ...result, edited: true } })
        }
        return NextResponse.json(result)
      }

      case 'update-channel': {
        const { channelId, name, description, isArchived } = body
        if (!channelId) {
          return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
        }

        const { db } = await import('@/lib/db')
        const { schema } = await import('@/lib/db')
        const { eq, and } = await import('drizzle-orm')

        const updates: Record<string, unknown> = { updatedAt: new Date() }
        if (name !== undefined) updates.name = name
        if (description !== undefined) updates.description = description
        if (isArchived !== undefined) updates.isArchived = isArchived

        const result = await db.update(schema.chatChannels)
          .set(updates)
          .where(and(
            eq(schema.chatChannels.id, channelId),
            eq(schema.chatChannels.orgId, orgId)
          ))
          .returning()

        if (!result.length) {
          return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
        }

        return NextResponse.json({ channel: result[0] })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[PUT /api/chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Chat operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/chat - Delete messages, channels
export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const messageId = url.searchParams.get('messageId')
    const channelId = url.searchParams.get('channelId')
    const deletedBy = url.searchParams.get('deletedBy')

    if (!deletedBy) {
      return NextResponse.json({ error: 'deletedBy is required' }, { status: 400 })
    }

    if (messageId) {
      const result = await deleteMessage(orgId, messageId, deletedBy)
      if (channelId) {
        broadcast(channelId, { type: 'message', data: { id: messageId, deleted: true } })
      }
      return NextResponse.json(result)
    }

    if (channelId) {
      const { db } = await import('@/lib/db')
      const { schema } = await import('@/lib/db')
      const { eq, and } = await import('drizzle-orm')

      // Verify the user is a channel admin
      const membership = await db.select()
        .from(schema.chatChannelMembers)
        .where(and(
          eq(schema.chatChannelMembers.channelId, channelId),
          eq(schema.chatChannelMembers.employeeId, deletedBy)
        ))

      if (!membership.length || membership[0].role !== 'admin') {
        return NextResponse.json(
          { error: 'Only channel admins can delete channels' },
          { status: 403 }
        )
      }

      // Archive instead of hard delete
      await db.update(schema.chatChannels)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(and(
          eq(schema.chatChannels.id, channelId),
          eq(schema.chatChannels.orgId, orgId)
        ))

      return NextResponse.json({ archived: true, channelId })
    }

    return NextResponse.json({ error: 'messageId or channelId is required' }, { status: 400 })
  } catch (error) {
    console.error('[DELETE /api/chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Chat operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
