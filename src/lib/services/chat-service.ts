/**
 * Built-in Chat Service
 *
 * Full-featured internal messaging platform for HR. Supports:
 * - Direct messages (1:1), group chats, department channels, announcements
 * - Thread replies with nested conversations
 * - Emoji reactions, message pinning, editing, and deletion
 * - Unread count tracking and read receipts
 * - Channel muting and notification control
 * - Message search with full-text matching
 * - Announcement channels with restricted posting
 * - Channel analytics and usage reporting
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, gte, lte, or, ilike, inArray, isNull, ne } from 'drizzle-orm'

// ============================================================
// Types & Interfaces
// ============================================================

export type ChannelType = 'direct' | 'group' | 'department' | 'announcement' | 'public'
export type MessageType = 'text' | 'file' | 'system' | 'announcement'

export interface CreateChannelInput {
  name?: string
  description?: string
  type: ChannelType
  departmentId?: string
  memberIds: string[]
}

export interface SendMessageInput {
  channelId: string
  senderId: string
  content: string
  type?: MessageType
  threadId?: string
  parentMessageId?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileMimeType?: string
  mentions?: string[]
  metadata?: Record<string, unknown>
}

export interface EditMessageInput {
  messageId: string
  newContent: string
  editorId: string
}

export interface ChannelAnalytics {
  channelId: string
  channelName: string
  channelType: ChannelType
  memberCount: number
  totalMessages: number
  messagesLast7Days: number
  messagesLast30Days: number
  activeMembers7Days: number
  threadCount: number
  reactionCount: number
  pinnedMessageCount: number
  topContributors: { employeeId: string; messageCount: number }[]
  mostUsedReactions: { emoji: string; count: number }[]
}

export interface UnreadSummary {
  totalUnread: number
  channels: { channelId: string; channelName: string | null; unreadCount: number; lastMessageAt: Date | null }[]
}

export interface SearchResult {
  messages: {
    id: string
    content: string
    senderId: string
    channelId: string
    channelName: string | null
    createdAt: Date
    threadId: string | null
  }[]
  totalResults: number
}

// ============================================================
// Error Classes
// ============================================================

export class ChatError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ChatError'
  }
}

// ============================================================
// Channel Management
// ============================================================

/**
 * Create a new chat channel.
 * For direct messages, auto-names the channel.
 * For announcements, only admins can post.
 */
export async function createChannel(
  orgId: string,
  createdBy: string,
  input: CreateChannelInput
) {
  // Validate inputs
  if (!input.type) {
    throw new ChatError('Channel type is required', 'MISSING_TYPE')
  }
  if (input.type !== 'direct' && !input.name?.trim()) {
    throw new ChatError('Channel name is required for non-direct channels', 'MISSING_NAME')
  }
  if (!input.memberIds?.length) {
    throw new ChatError('At least one member is required', 'NO_MEMBERS')
  }

  // For direct messages, check for existing DM channel between the same users
  if (input.type === 'direct') {
    if (input.memberIds.length > 2) {
      throw new ChatError('Direct message channels can only have 2 members', 'TOO_MANY_DM_MEMBERS')
    }

    // Ensure creator is in member list
    const allMemberIds = [...new Set([createdBy, ...input.memberIds])]

    // Check for existing DM between these users
    const existingChannels = await db.select()
      .from(schema.chatChannels)
      .where(and(
        eq(schema.chatChannels.orgId, orgId),
        eq(schema.chatChannels.type, 'direct'),
        eq(schema.chatChannels.isArchived, false)
      ))

    for (const channel of existingChannels) {
      const members = await db.select()
        .from(schema.chatChannelMembers)
        .where(eq(schema.chatChannelMembers.channelId, channel.id))

      const memberIdSet = new Set(members.map(m => m.employeeId))
      if (
        memberIdSet.size === allMemberIds.length &&
        allMemberIds.every(id => memberIdSet.has(id))
      ) {
        // Return existing DM channel
        return { channel, members, isExisting: true }
      }
    }

    input.memberIds = allMemberIds
  }

  // Ensure creator is a member
  if (!input.memberIds.includes(createdBy)) {
    input.memberIds.push(createdBy)
  }

  // Create the channel
  const [channel] = await db.insert(schema.chatChannels).values({
    orgId,
    name: input.name?.trim() || null,
    description: input.description || null,
    type: input.type,
    departmentId: input.departmentId || null,
    createdBy,
    isArchived: false,
    pinnedMessageIds: [],
  }).returning()

  // Add members
  const memberValues = input.memberIds.map(employeeId => ({
    channelId: channel.id,
    employeeId,
    orgId,
    role: employeeId === createdBy ? 'admin' : 'member',
    isMuted: false,
  }))

  const members = await db.insert(schema.chatChannelMembers).values(memberValues).returning()

  // Send system message for non-DM channels
  if (input.type !== 'direct') {
    await db.insert(schema.chatMessages).values({
      channelId: channel.id,
      orgId,
      senderId: createdBy,
      type: 'system',
      content: `Channel "${input.name}" was created`,
    })
  }

  return { channel, members, isExisting: false }
}

/**
 * Create an announcement channel with restricted posting permissions.
 * Only admins of the channel can post.
 */
export async function createAnnouncementChannel(
  orgId: string,
  createdBy: string,
  name: string,
  description: string,
  memberIds: string[],
  adminIds: string[]
) {
  if (!name?.trim()) {
    throw new ChatError('Channel name is required', 'MISSING_NAME')
  }
  if (!adminIds?.length) {
    throw new ChatError('At least one admin is required for announcement channels', 'NO_ADMINS')
  }

  const allMemberIds = [...new Set([createdBy, ...memberIds, ...adminIds])]

  const [channel] = await db.insert(schema.chatChannels).values({
    orgId,
    name: name.trim(),
    description: description || null,
    type: 'announcement',
    createdBy,
    isArchived: false,
    pinnedMessageIds: [],
    metadata: { adminIds },
  }).returning()

  const memberValues = allMemberIds.map(employeeId => ({
    channelId: channel.id,
    employeeId,
    orgId,
    role: adminIds.includes(employeeId) || employeeId === createdBy ? 'admin' : 'member',
    isMuted: false,
  }))

  const members = await db.insert(schema.chatChannelMembers).values(memberValues).returning()

  await db.insert(schema.chatMessages).values({
    channelId: channel.id,
    orgId,
    senderId: createdBy,
    type: 'system',
    content: `Announcement channel "${name}" was created. Only admins can post.`,
  })

  return { channel, members }
}

// ============================================================
// Message Operations
// ============================================================

/**
 * Send a message to a channel.
 * Validates membership, handles threads, updates channel timestamp.
 */
export async function sendMessage(
  orgId: string,
  input: SendMessageInput
) {
  const { channelId, senderId, content, type, threadId, parentMessageId } = input

  if (!content?.trim() && !input.fileUrl) {
    throw new ChatError('Message content or file is required', 'EMPTY_MESSAGE')
  }

  // Verify channel exists
  const channels = await db.select()
    .from(schema.chatChannels)
    .where(and(
      eq(schema.chatChannels.id, channelId),
      eq(schema.chatChannels.orgId, orgId)
    ))

  const channel = channels[0]
  if (!channel) {
    throw new ChatError('Channel not found', 'CHANNEL_NOT_FOUND')
  }
  if (channel.isArchived) {
    throw new ChatError('Cannot send messages to archived channels', 'CHANNEL_ARCHIVED')
  }

  // Verify sender is a member
  const membership = await db.select()
    .from(schema.chatChannelMembers)
    .where(and(
      eq(schema.chatChannelMembers.channelId, channelId),
      eq(schema.chatChannelMembers.employeeId, senderId)
    ))

  if (!membership.length) {
    throw new ChatError('You are not a member of this channel', 'NOT_A_MEMBER')
  }

  // For announcement channels, verify sender is admin
  if (channel.type === 'announcement' && membership[0].role !== 'admin') {
    throw new ChatError(
      'Only admins can post in announcement channels',
      'ANNOUNCEMENT_ADMIN_ONLY'
    )
  }

  // Validate thread reference
  if (threadId || parentMessageId) {
    const parentId = parentMessageId || threadId
    const parentMessages = await db.select()
      .from(schema.chatMessages)
      .where(and(
        eq(schema.chatMessages.id, parentId!),
        eq(schema.chatMessages.channelId, channelId)
      ))

    if (!parentMessages.length) {
      throw new ChatError('Parent message not found in this channel', 'PARENT_NOT_FOUND')
    }
  }

  const now = new Date()

  // Create the message
  const [message] = await db.insert(schema.chatMessages).values({
    channelId,
    orgId,
    senderId,
    type: type || 'text',
    content: content?.trim() || '',
    threadId: threadId || null,
    parentMessageId: parentMessageId || null,
    fileUrl: input.fileUrl || null,
    fileName: input.fileName || null,
    fileSize: input.fileSize || null,
    fileMimeType: input.fileMimeType || null,
    mentions: input.mentions || null,
    metadata: input.metadata || null,
  }).returning()

  // Update channel's last message timestamp
  await db.update(schema.chatChannels)
    .set({ lastMessageAt: now, updatedAt: now })
    .where(eq(schema.chatChannels.id, channelId))

  return message
}

/**
 * Edit an existing message. Only the original sender can edit.
 */
export async function editMessage(
  orgId: string,
  input: EditMessageInput
) {
  const { messageId, newContent, editorId } = input

  if (!newContent?.trim()) {
    throw new ChatError('New content is required', 'EMPTY_CONTENT')
  }

  const messages = await db.select()
    .from(schema.chatMessages)
    .where(and(
      eq(schema.chatMessages.id, messageId),
      eq(schema.chatMessages.orgId, orgId)
    ))

  const message = messages[0]
  if (!message) {
    throw new ChatError('Message not found', 'MESSAGE_NOT_FOUND')
  }
  if (message.senderId !== editorId) {
    throw new ChatError('Only the original sender can edit a message', 'NOT_SENDER')
  }
  if (message.isDeleted) {
    throw new ChatError('Cannot edit a deleted message', 'MESSAGE_DELETED')
  }

  const now = new Date()
  const [updated] = await db.update(schema.chatMessages)
    .set({
      content: newContent.trim(),
      isEdited: true,
      editedAt: now,
      updatedAt: now,
      metadata: {
        ...(message.metadata as Record<string, unknown> || {}),
        previousContent: message.content,
        editedAt: now.toISOString(),
      },
    })
    .where(eq(schema.chatMessages.id, messageId))
    .returning()

  return updated
}

/**
 * Soft-delete a message. Only the sender or channel admin can delete.
 */
export async function deleteMessage(
  orgId: string,
  messageId: string,
  deletedBy: string
) {
  const messages = await db.select()
    .from(schema.chatMessages)
    .where(and(
      eq(schema.chatMessages.id, messageId),
      eq(schema.chatMessages.orgId, orgId)
    ))

  const message = messages[0]
  if (!message) {
    throw new ChatError('Message not found', 'MESSAGE_NOT_FOUND')
  }

  // Check if deleter is sender or channel admin
  const isSender = message.senderId === deletedBy
  if (!isSender) {
    const membership = await db.select()
      .from(schema.chatChannelMembers)
      .where(and(
        eq(schema.chatChannelMembers.channelId, message.channelId),
        eq(schema.chatChannelMembers.employeeId, deletedBy)
      ))

    if (!membership.length || membership[0].role !== 'admin') {
      throw new ChatError(
        'Only the message sender or channel admin can delete messages',
        'PERMISSION_DENIED'
      )
    }
  }

  const now = new Date()
  const [updated] = await db.update(schema.chatMessages)
    .set({
      isDeleted: true,
      deletedAt: now,
      content: '[Message deleted]',
      updatedAt: now,
    })
    .where(eq(schema.chatMessages.id, messageId))
    .returning()

  return updated
}

// ============================================================
// Reactions
// ============================================================

/**
 * Add an emoji reaction to a message.
 */
export async function addReaction(
  orgId: string,
  messageId: string,
  employeeId: string,
  emoji: string
) {
  if (!emoji?.trim()) {
    throw new ChatError('Emoji is required', 'MISSING_EMOJI')
  }

  // Verify message exists
  const messages = await db.select()
    .from(schema.chatMessages)
    .where(and(
      eq(schema.chatMessages.id, messageId),
      eq(schema.chatMessages.orgId, orgId)
    ))

  if (!messages.length) {
    throw new ChatError('Message not found', 'MESSAGE_NOT_FOUND')
  }

  // Check for duplicate reaction
  const existing = await db.select()
    .from(schema.chatReactions)
    .where(and(
      eq(schema.chatReactions.messageId, messageId),
      eq(schema.chatReactions.employeeId, employeeId),
      eq(schema.chatReactions.emoji, emoji)
    ))

  if (existing.length > 0) {
    // Already reacted - return existing
    return { reaction: existing[0], isNew: false }
  }

  const [reaction] = await db.insert(schema.chatReactions).values({
    messageId,
    employeeId,
    orgId,
    emoji: emoji.trim(),
  }).returning()

  return { reaction, isNew: true }
}

/**
 * Remove an emoji reaction from a message.
 */
export async function removeReaction(
  orgId: string,
  messageId: string,
  employeeId: string,
  emoji: string
) {
  const reactions = await db.select()
    .from(schema.chatReactions)
    .where(and(
      eq(schema.chatReactions.messageId, messageId),
      eq(schema.chatReactions.employeeId, employeeId),
      eq(schema.chatReactions.emoji, emoji),
      eq(schema.chatReactions.orgId, orgId)
    ))

  if (!reactions.length) {
    throw new ChatError('Reaction not found', 'REACTION_NOT_FOUND')
  }

  await db.delete(schema.chatReactions)
    .where(eq(schema.chatReactions.id, reactions[0].id))

  return { removed: true, messageId, emoji }
}

// ============================================================
// Pin / Thread / Participant Management
// ============================================================

/**
 * Pin or unpin a message in a channel.
 */
export async function pinMessage(
  orgId: string,
  messageId: string,
  pinnedBy: string,
  pin: boolean = true
) {
  const messages = await db.select()
    .from(schema.chatMessages)
    .where(and(
      eq(schema.chatMessages.id, messageId),
      eq(schema.chatMessages.orgId, orgId)
    ))

  const message = messages[0]
  if (!message) {
    throw new ChatError('Message not found', 'MESSAGE_NOT_FOUND')
  }

  // Verify pinner is a channel member
  const membership = await db.select()
    .from(schema.chatChannelMembers)
    .where(and(
      eq(schema.chatChannelMembers.channelId, message.channelId),
      eq(schema.chatChannelMembers.employeeId, pinnedBy)
    ))

  if (!membership.length) {
    throw new ChatError('You must be a channel member to pin messages', 'NOT_A_MEMBER')
  }

  const now = new Date()
  const [updated] = await db.update(schema.chatMessages)
    .set({
      isPinned: pin,
      pinnedAt: pin ? now : null,
      pinnedBy: pin ? pinnedBy : null,
      updatedAt: now,
    })
    .where(eq(schema.chatMessages.id, messageId))
    .returning()

  // Update channel's pinned message IDs
  const channel = await db.select()
    .from(schema.chatChannels)
    .where(eq(schema.chatChannels.id, message.channelId))

  if (channel.length > 0) {
    const currentPinned = (channel[0].pinnedMessageIds as string[]) || []
    const updatedPinned = pin
      ? [...new Set([...currentPinned, messageId])]
      : currentPinned.filter(id => id !== messageId)

    await db.update(schema.chatChannels)
      .set({ pinnedMessageIds: updatedPinned, updatedAt: now })
      .where(eq(schema.chatChannels.id, message.channelId))
  }

  return updated
}

/**
 * Create a thread on a message (returns the thread ID).
 * A thread is simply a collection of replies to a parent message.
 */
export async function createThread(
  orgId: string,
  parentMessageId: string,
  senderId: string,
  content: string
) {
  // Verify parent message
  const parentMessages = await db.select()
    .from(schema.chatMessages)
    .where(and(
      eq(schema.chatMessages.id, parentMessageId),
      eq(schema.chatMessages.orgId, orgId)
    ))

  const parentMessage = parentMessages[0]
  if (!parentMessage) {
    throw new ChatError('Parent message not found', 'PARENT_NOT_FOUND')
  }

  // Use the parent message ID as the thread ID
  const threadId = parentMessage.threadId || parentMessageId

  // Send a reply in the thread
  const reply = await sendMessage(orgId, {
    channelId: parentMessage.channelId,
    senderId,
    content,
    threadId,
    parentMessageId,
  })

  return { threadId, reply }
}

/**
 * Add a participant to a channel.
 */
export async function addParticipant(
  orgId: string,
  channelId: string,
  employeeId: string,
  addedBy: string
) {
  // Verify channel
  const channels = await db.select()
    .from(schema.chatChannels)
    .where(and(
      eq(schema.chatChannels.id, channelId),
      eq(schema.chatChannels.orgId, orgId)
    ))

  const channel = channels[0]
  if (!channel) {
    throw new ChatError('Channel not found', 'CHANNEL_NOT_FOUND')
  }

  if (channel.type === 'direct') {
    throw new ChatError('Cannot add participants to direct messages', 'DIRECT_NO_ADD')
  }

  // Check if already a member
  const existing = await db.select()
    .from(schema.chatChannelMembers)
    .where(and(
      eq(schema.chatChannelMembers.channelId, channelId),
      eq(schema.chatChannelMembers.employeeId, employeeId)
    ))

  if (existing.length > 0) {
    return { member: existing[0], isNew: false }
  }

  // Verify employee exists
  const employees = await db.select()
    .from(schema.employees)
    .where(and(
      eq(schema.employees.id, employeeId),
      eq(schema.employees.orgId, orgId)
    ))

  if (!employees.length) {
    throw new ChatError('Employee not found', 'EMPLOYEE_NOT_FOUND')
  }

  const [member] = await db.insert(schema.chatChannelMembers).values({
    channelId,
    employeeId,
    orgId,
    role: 'member',
    isMuted: false,
  }).returning()

  // System message
  await sendMessage(orgId, {
    channelId,
    senderId: addedBy,
    content: `${employees[0].fullName} was added to the channel`,
    type: 'system',
  })

  return { member, isNew: true }
}

/**
 * Remove a participant from a channel.
 */
export async function removeParticipant(
  orgId: string,
  channelId: string,
  employeeId: string,
  removedBy: string
) {
  const channels = await db.select()
    .from(schema.chatChannels)
    .where(and(
      eq(schema.chatChannels.id, channelId),
      eq(schema.chatChannels.orgId, orgId)
    ))

  const channel = channels[0]
  if (!channel) {
    throw new ChatError('Channel not found', 'CHANNEL_NOT_FOUND')
  }

  if (channel.type === 'direct') {
    throw new ChatError('Cannot remove participants from direct messages', 'DIRECT_NO_REMOVE')
  }

  // Can't remove yourself if you're the only admin
  if (employeeId === removedBy) {
    const admins = await db.select()
      .from(schema.chatChannelMembers)
      .where(and(
        eq(schema.chatChannelMembers.channelId, channelId),
        eq(schema.chatChannelMembers.role, 'admin')
      ))

    if (admins.length <= 1 && admins[0]?.employeeId === employeeId) {
      throw new ChatError(
        'Cannot leave channel as the only admin. Promote another member first.',
        'LAST_ADMIN'
      )
    }
  }

  await db.delete(schema.chatChannelMembers)
    .where(and(
      eq(schema.chatChannelMembers.channelId, channelId),
      eq(schema.chatChannelMembers.employeeId, employeeId)
    ))

  return { removed: true, channelId, employeeId }
}

/**
 * Mute or unmute a channel for a specific user.
 */
export async function muteChannel(
  orgId: string,
  channelId: string,
  employeeId: string,
  mute: boolean
) {
  const membership = await db.select()
    .from(schema.chatChannelMembers)
    .where(and(
      eq(schema.chatChannelMembers.channelId, channelId),
      eq(schema.chatChannelMembers.employeeId, employeeId)
    ))

  if (!membership.length) {
    throw new ChatError('You are not a member of this channel', 'NOT_A_MEMBER')
  }

  const [updated] = await db.update(schema.chatChannelMembers)
    .set({ isMuted: mute })
    .where(eq(schema.chatChannelMembers.id, membership[0].id))
    .returning()

  return updated
}

// ============================================================
// Search & Read Status
// ============================================================

/**
 * Search messages across all channels the user is a member of.
 */
export async function searchMessages(
  orgId: string,
  employeeId: string,
  query: string,
  options?: { channelId?: string; limit?: number; offset?: number }
): Promise<SearchResult> {
  if (!query?.trim()) {
    throw new ChatError('Search query is required', 'MISSING_QUERY')
  }

  // Get channels the user is a member of
  const memberships = await db.select()
    .from(schema.chatChannelMembers)
    .where(and(
      eq(schema.chatChannelMembers.employeeId, employeeId),
      eq(schema.chatChannelMembers.orgId, orgId)
    ))

  const memberChannelIds = memberships.map(m => m.channelId)
  if (memberChannelIds.length === 0) {
    return { messages: [], totalResults: 0 }
  }

  // Filter to specific channel if provided
  const searchChannelIds = options?.channelId
    ? memberChannelIds.filter(id => id === options.channelId)
    : memberChannelIds

  if (searchChannelIds.length === 0) {
    return { messages: [], totalResults: 0 }
  }

  const searchConditions = [
    inArray(schema.chatMessages.channelId, searchChannelIds),
    eq(schema.chatMessages.orgId, orgId),
    eq(schema.chatMessages.isDeleted, false),
    ilike(schema.chatMessages.content, `%${query}%`),
  ]

  const messages = await db.select({
    message: schema.chatMessages,
    channel: schema.chatChannels,
  })
    .from(schema.chatMessages)
    .leftJoin(schema.chatChannels, eq(schema.chatMessages.channelId, schema.chatChannels.id))
    .where(and(...searchConditions))
    .orderBy(desc(schema.chatMessages.createdAt))
    .limit(options?.limit || 20)
    .offset(options?.offset || 0)

  return {
    messages: messages.map(({ message, channel }) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      channelId: message.channelId,
      channelName: channel?.name || null,
      createdAt: message.createdAt,
      threadId: message.threadId,
    })),
    totalResults: messages.length,
  }
}

/**
 * Get unread message count for a user across all channels.
 */
export async function getUnreadCount(
  orgId: string,
  employeeId: string
): Promise<UnreadSummary> {
  // Get all channel memberships
  const memberships = await db.select({
    membership: schema.chatChannelMembers,
    channel: schema.chatChannels,
  })
    .from(schema.chatChannelMembers)
    .leftJoin(schema.chatChannels, eq(schema.chatChannelMembers.channelId, schema.chatChannels.id))
    .where(and(
      eq(schema.chatChannelMembers.employeeId, employeeId),
      eq(schema.chatChannelMembers.orgId, orgId),
      eq(schema.chatChannelMembers.isMuted, false)
    ))

  let totalUnread = 0
  const channelUnreads: UnreadSummary['channels'] = []

  for (const { membership, channel } of memberships) {
    // Count messages after last read timestamp
    const lastRead = membership.lastReadAt || new Date(0)

    const conditions = [
      eq(schema.chatMessages.channelId, membership.channelId),
      eq(schema.chatMessages.isDeleted, false),
      ne(schema.chatMessages.senderId, employeeId), // Don't count own messages
      gte(schema.chatMessages.createdAt, lastRead),
    ]

    const unreadMessages = await db.select()
      .from(schema.chatMessages)
      .where(and(...conditions))

    const unreadCount = unreadMessages.length

    if (unreadCount > 0) {
      totalUnread += unreadCount
      channelUnreads.push({
        channelId: membership.channelId,
        channelName: channel?.name || null,
        unreadCount,
        lastMessageAt: channel?.lastMessageAt || null,
      })
    }
  }

  // Sort by most recent activity
  channelUnreads.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  return { totalUnread, channels: channelUnreads }
}

/**
 * Mark all messages in a channel as read for a user.
 */
export async function markAsRead(
  orgId: string,
  channelId: string,
  employeeId: string
) {
  const membership = await db.select()
    .from(schema.chatChannelMembers)
    .where(and(
      eq(schema.chatChannelMembers.channelId, channelId),
      eq(schema.chatChannelMembers.employeeId, employeeId)
    ))

  if (!membership.length) {
    throw new ChatError('You are not a member of this channel', 'NOT_A_MEMBER')
  }

  const now = new Date()
  const [updated] = await db.update(schema.chatChannelMembers)
    .set({ lastReadAt: now })
    .where(eq(schema.chatChannelMembers.id, membership[0].id))
    .returning()

  return { channelId, lastReadAt: now }
}

// ============================================================
// Analytics
// ============================================================

/**
 * Get analytics for a specific channel.
 */
export async function getChannelAnalytics(
  orgId: string,
  channelId: string
): Promise<ChannelAnalytics> {
  const channels = await db.select()
    .from(schema.chatChannels)
    .where(and(
      eq(schema.chatChannels.id, channelId),
      eq(schema.chatChannels.orgId, orgId)
    ))

  const channel = channels[0]
  if (!channel) {
    throw new ChatError('Channel not found', 'CHANNEL_NOT_FOUND')
  }

  // Get members
  const members = await db.select()
    .from(schema.chatChannelMembers)
    .where(eq(schema.chatChannelMembers.channelId, channelId))

  // Get all messages
  const allMessages = await db.select()
    .from(schema.chatMessages)
    .where(and(
      eq(schema.chatMessages.channelId, channelId),
      eq(schema.chatMessages.isDeleted, false)
    ))

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const messagesLast7Days = allMessages.filter(m => new Date(m.createdAt) >= sevenDaysAgo).length
  const messagesLast30Days = allMessages.filter(m => new Date(m.createdAt) >= thirtyDaysAgo).length

  // Active members in last 7 days
  const recentSenders = new Set(
    allMessages
      .filter(m => new Date(m.createdAt) >= sevenDaysAgo)
      .map(m => m.senderId)
  )

  // Thread count
  const threadIds = new Set(allMessages.filter(m => m.threadId).map(m => m.threadId))

  // Pinned messages
  const pinnedCount = allMessages.filter(m => m.isPinned).length

  // Top contributors
  const contributorCounts = new Map<string, number>()
  for (const msg of allMessages) {
    if (msg.type !== 'system') {
      contributorCounts.set(msg.senderId, (contributorCounts.get(msg.senderId) || 0) + 1)
    }
  }
  const topContributors = Array.from(contributorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([employeeId, messageCount]) => ({ employeeId, messageCount }))

  // Get reactions
  const messageIds = allMessages.map(m => m.id)
  let reactions: typeof schema.chatReactions.$inferSelect[] = []
  if (messageIds.length > 0) {
    reactions = await db.select()
      .from(schema.chatReactions)
      .where(inArray(schema.chatReactions.messageId, messageIds))
  }

  // Most used reactions
  const emojiCounts = new Map<string, number>()
  for (const reaction of reactions) {
    emojiCounts.set(reaction.emoji, (emojiCounts.get(reaction.emoji) || 0) + 1)
  }
  const mostUsedReactions = Array.from(emojiCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({ emoji, count }))

  return {
    channelId,
    channelName: channel.name || 'Direct Message',
    channelType: channel.type as ChannelType,
    memberCount: members.length,
    totalMessages: allMessages.length,
    messagesLast7Days,
    messagesLast30Days,
    activeMembers7Days: recentSenders.size,
    threadCount: threadIds.size,
    reactionCount: reactions.length,
    pinnedMessageCount: pinnedCount,
    topContributors,
    mostUsedReactions,
  }
}

/**
 * List channels for a user.
 */
export async function listChannels(
  orgId: string,
  employeeId: string,
  filters?: { type?: ChannelType }
) {
  const memberships = await db.select({
    membership: schema.chatChannelMembers,
    channel: schema.chatChannels,
  })
    .from(schema.chatChannelMembers)
    .leftJoin(schema.chatChannels, eq(schema.chatChannelMembers.channelId, schema.chatChannels.id))
    .where(and(
      eq(schema.chatChannelMembers.employeeId, employeeId),
      eq(schema.chatChannelMembers.orgId, orgId)
    ))

  let channels = memberships
    .filter(m => m.channel && !m.channel.isArchived)
    .map(({ membership, channel }) => ({
      ...channel!,
      isMuted: membership.isMuted,
      role: membership.role,
      lastReadAt: membership.lastReadAt,
    }))

  if (filters?.type) {
    channels = channels.filter(c => c.type === filters.type)
  }

  // Sort by last message timestamp
  channels.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  return { channels, total: channels.length }
}

/**
 * Get messages for a channel with pagination.
 */
export async function getMessages(
  orgId: string,
  channelId: string,
  employeeId: string,
  options?: { limit?: number; before?: string; threadId?: string }
) {
  // Verify membership
  const membership = await db.select()
    .from(schema.chatChannelMembers)
    .where(and(
      eq(schema.chatChannelMembers.channelId, channelId),
      eq(schema.chatChannelMembers.employeeId, employeeId)
    ))

  if (!membership.length) {
    throw new ChatError('You are not a member of this channel', 'NOT_A_MEMBER')
  }

  const conditions = [
    eq(schema.chatMessages.channelId, channelId),
    eq(schema.chatMessages.orgId, orgId),
  ]

  // Filter for thread messages
  if (options?.threadId) {
    conditions.push(eq(schema.chatMessages.threadId, options.threadId))
  } else {
    // Only top-level messages (no thread replies) unless viewing a thread
    conditions.push(isNull(schema.chatMessages.threadId))
  }

  if (options?.before) {
    conditions.push(lte(schema.chatMessages.createdAt, new Date(options.before)))
  }

  const messages = await db.select()
    .from(schema.chatMessages)
    .where(and(...conditions))
    .orderBy(desc(schema.chatMessages.createdAt))
    .limit(options?.limit || 50)

  // Get reactions for these messages
  const messageIds = messages.map(m => m.id)
  let reactions: typeof schema.chatReactions.$inferSelect[] = []
  if (messageIds.length > 0) {
    reactions = await db.select()
      .from(schema.chatReactions)
      .where(inArray(schema.chatReactions.messageId, messageIds))
  }

  // Group reactions by message
  const reactionsByMessage = reactions.reduce((acc, r) => {
    if (!acc[r.messageId]) acc[r.messageId] = []
    acc[r.messageId].push(r)
    return acc
  }, {} as Record<string, typeof reactions>)

  // Count thread replies for each message
  const threadCounts: Record<string, number> = {}
  if (!options?.threadId && messageIds.length > 0) {
    for (const msgId of messageIds) {
      const threadReplies = await db.select()
        .from(schema.chatMessages)
        .where(and(
          eq(schema.chatMessages.threadId, msgId),
          eq(schema.chatMessages.isDeleted, false)
        ))
      if (threadReplies.length > 0) {
        threadCounts[msgId] = threadReplies.length
      }
    }
  }

  return {
    messages: messages.reverse().map(msg => ({
      ...msg,
      reactions: reactionsByMessage[msg.id] || [],
      threadReplyCount: threadCounts[msg.id] || 0,
    })),
    hasMore: messages.length === (options?.limit || 50),
  }
}
