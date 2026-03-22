/**
 * Platform Notification Bot Service
 *
 * Posts automated messages to Chat channels when platform events happen.
 * Works with both the real DB-backed chat service and the local store for demo mode.
 */

import {
  type PlatformEvent,
  type PlatformEventType,
  NOTIFICATION_CHANNELS,
  BOT_CHANNEL_NAMES,
} from './notification-config'

// ---- Bot identity ----
export const PLATFORM_BOT = {
  id: 'platform-bot',
  name: 'Tempo Bot',
  avatar: null,
  isBot: true,
} as const

// ---- Types ----

export interface BotMessage {
  id: string
  channel_name: string
  channel_id?: string
  sender_id: string
  sender_name: string
  is_bot: true
  content: string
  title: string
  icon: string
  link: string
  priority: string
  event_type: PlatformEventType
  sent_at: string
  metadata?: Record<string, unknown>
}

// ---- Format a platform event into bot messages ----

export function formatBotMessages(event: PlatformEvent): BotMessage[] {
  const config = NOTIFICATION_CHANNELS[event.type]
  if (!config) return []

  const title = config.titleTemplate(event.data)
  const body = config.template(event.data)
  const now = event.timestamp || new Date().toISOString()

  return config.channels.map((channelName) => ({
    id: `bot-${event.id}-${channelName}`,
    channel_name: channelName,
    sender_id: PLATFORM_BOT.id,
    sender_name: PLATFORM_BOT.name,
    is_bot: true as const,
    content: `${config.icon} **${title}**\n${body}\n\u2192 [View Details](${config.link})`,
    title,
    icon: config.icon,
    link: config.link,
    priority: config.priority,
    event_type: event.type,
    sent_at: now,
    metadata: event.data,
  }))
}

// ---- Create a PlatformEvent helper ----

export function createPlatformEvent(
  type: PlatformEventType,
  data: Record<string, unknown>,
  actorName?: string,
  actorId?: string
): PlatformEvent {
  return {
    id: crypto.randomUUID(),
    type,
    title: NOTIFICATION_CHANNELS[type]?.titleTemplate(data) ?? type,
    data,
    timestamp: new Date().toISOString(),
    actorName,
    actorId,
  }
}

// ---- Post to local store (demo mode) ----

/**
 * Post a platform notification to the local chat store.
 * This is the primary integration point for demo mode.
 *
 * @param event - The platform event to post
 * @param addChatMessage - The store's addChatMessage function
 * @param chatChannels - Current chat channels from the store
 * @param addChatChannel - The store's addChatChannel function (for auto-creating channels)
 * @returns The bot messages that were posted
 */
export function postPlatformNotification(
  event: PlatformEvent,
  addChatMessage: (data: Record<string, unknown>) => void,
  chatChannels: Record<string, unknown>[],
  addChatChannel?: (data: Record<string, unknown>) => void,
): BotMessage[] {
  const messages = formatBotMessages(event)

  for (const msg of messages) {
    // Find existing channel by name
    let channel = chatChannels.find(
      (c: Record<string, unknown>) =>
        (c.name as string)?.toLowerCase() === `#${msg.channel_name}` ||
        (c.name as string)?.toLowerCase() === msg.channel_name
    )

    // Auto-create channel if it doesn't exist and we have the function
    if (!channel && addChatChannel && BOT_CHANNEL_NAMES.includes(msg.channel_name as typeof BOT_CHANNEL_NAMES[number])) {
      addChatChannel({
        name: `#${msg.channel_name}`,
        type: 'public',
        description: `Auto-created channel for ${msg.channel_name} notifications`,
      })
      // We won't have the ID immediately, so we post with channel_name as fallback
    }

    const channelId = (channel as Record<string, unknown>)?.id as string | undefined

    addChatMessage({
      channel_id: channelId || msg.channel_name,
      channel_name: msg.channel_name,
      sender_id: PLATFORM_BOT.id,
      sender_name: PLATFORM_BOT.name,
      is_bot: true,
      content: msg.content,
      type: 'system',
      event_type: msg.event_type,
      title: msg.title,
      icon: msg.icon,
      link: msg.link,
      priority: msg.priority,
      metadata: msg.metadata,
    })
  }

  return messages
}

// ---- Relative time formatting ----

export function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'just now'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
