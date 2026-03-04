// In-memory pub/sub for chat events (single-process deployment)
// Subscribers register by employeeId + channel list
// Messages broadcast to all subscribers of a given channel

type ChatEvent = {
  type: 'message' | 'reaction' | 'typing' | 'presence' | 'channel-update'
  channelId: string
  data: any
}

type Subscriber = {
  employeeId: string
  channels: Set<string>
  callback: (event: ChatEvent) => void
}

const subscribers = new Map<string, Subscriber>()

export function subscribe(
  employeeId: string,
  channelIds: string[],
  callback: (event: ChatEvent) => void
): () => void {
  const id = `${employeeId}-${Date.now()}`
  subscribers.set(id, {
    employeeId,
    channels: new Set(channelIds),
    callback,
  })
  return () => { subscribers.delete(id) }
}

export function broadcast(channelId: string, event: Omit<ChatEvent, 'channelId'>) {
  const fullEvent: ChatEvent = { ...event, channelId }
  for (const sub of subscribers.values()) {
    if (sub.channels.has(channelId)) {
      try { sub.callback(fullEvent) } catch { /* ignore */ }
    }
  }
}

export function addChannelToSubscriber(employeeId: string, channelId: string) {
  for (const sub of subscribers.values()) {
    if (sub.employeeId === employeeId) {
      sub.channels.add(channelId)
    }
  }
}

export function getSubscriberCount(): number {
  return subscribers.size
}
