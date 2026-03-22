// ============================================================
// Slack Connector
// Bidirectional sync: Channels/Departments, Messages, User Status/Leave
// Auth: OAuth2 Bot Token, Event API support
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'
import {
  executeDemoSync,
  retryWithBackoff,
  verifyWebhookSignature,
  type SyncResult as BidiSyncResult,
  type SyncConfig,
  type FieldMapping,
} from '../services/integration-sync'

const SLACK_API_BASE = 'https://slack.com/api'

interface SlackChannel {
  id: string
  name: string
  is_channel: boolean
  is_private: boolean
  num_members: number
}

interface SlackUser {
  id: string
  name: string
  real_name: string
  profile: {
    email?: string
    display_name?: string
    image_48?: string
  }
  is_bot: boolean
  deleted: boolean
}

interface SlackMessagePayload {
  channel: string
  text: string
  blocks?: Array<Record<string, unknown>>
  thread_ts?: string
}

async function slackApi<T>(
  botToken: string,
  method: string,
  params?: Record<string, string> | SlackMessagePayload
): Promise<T & { ok: boolean; error?: string }> {
  const isPost = ['chat.postMessage', 'chat.update', 'conversations.invite'].includes(method)

  const url = `${SLACK_API_BASE}/${method}`
  const options: RequestInit = {
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': isPost ? 'application/json' : 'application/x-www-form-urlencoded',
    },
  }

  if (isPost) {
    options.method = 'POST'
    options.body = JSON.stringify(params)
  } else {
    const searchParams = new URLSearchParams(params as Record<string, string>)
    const response = await fetch(`${url}?${searchParams}`, {
      ...options,
      method: 'GET',
    })
    if (!response.ok) {
      throw new Error(`Slack API HTTP error: ${response.status}`)
    }
    return response.json()
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Slack API HTTP error: ${response.status}`)
  }
  return response.json()
}

async function fetchSlackChannels(botToken: string): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = []
  let cursor: string | undefined

  do {
    const params: Record<string, string> = {
      types: 'public_channel,private_channel',
      limit: '200',
    }
    if (cursor) params.cursor = cursor

    const data = await slackApi<{
      channels: SlackChannel[]
      response_metadata?: { next_cursor?: string }
    }>(botToken, 'conversations.list', params)

    if (!data.ok) throw new Error(`Failed to list channels: ${data.error}`)

    channels.push(...(data.channels || []))
    cursor = data.response_metadata?.next_cursor || undefined
  } while (cursor)

  return channels
}

async function fetchSlackUsers(botToken: string): Promise<SlackUser[]> {
  const users: SlackUser[] = []
  let cursor: string | undefined

  do {
    const params: Record<string, string> = { limit: '200' }
    if (cursor) params.cursor = cursor

    const data = await slackApi<{
      members: SlackUser[]
      response_metadata?: { next_cursor?: string }
    }>(botToken, 'users.list', params)

    if (!data.ok) throw new Error(`Failed to list users: ${data.error}`)

    users.push(...(data.members || []).filter(u => !u.is_bot && !u.deleted))
    cursor = data.response_metadata?.next_cursor || undefined
  } while (cursor)

  return users
}

export async function sendSlackMessage(
  botToken: string,
  channel: string,
  text: string,
  blocks?: Array<Record<string, unknown>>
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const payload: SlackMessagePayload = { channel, text }
  if (blocks) payload.blocks = blocks

  return slackApi(botToken, 'chat.postMessage', payload)
}

export const slackConnector: IntegrationConnector = {
  id: 'slack',
  name: 'Slack',
  description: 'Send notifications, workflow alerts, and engagement surveys via Slack.',
  icon: 'MessageSquare',
  category: 'communication',
  capabilities: ['Notifications', 'Workflow triggers', 'Survey distribution', 'Channel sync'],

  configSchema: [
    { key: 'workspace_url', label: 'Workspace URL', type: 'url', required: true, placeholder: 'https://yourworkspace.slack.com' },
    { key: 'bot_token', label: 'Bot Token', type: 'password', required: true, placeholder: 'xoxb-...' },
    { key: 'default_channel', label: 'Default Channel', type: 'text', required: false, placeholder: '#general or C01ABCDEF' },
  ] as ConfigField[],

  async connect(config: Record<string, string>): Promise<ConnectionResult> {
    try {
      const { bot_token } = config
      if (!bot_token) {
        return { success: false, error: 'Missing required field: Bot Token is required.' }
      }

      // Verify by calling auth.test
      const authResult = await slackApi<{
        team: string
        team_id: string
        user: string
        user_id: string
      }>(bot_token, 'auth.test')

      if (!authResult.ok) {
        return { success: false, error: `Slack auth failed: ${authResult.error}` }
      }

      return {
        success: true,
        metadata: {
          team: authResult.team,
          teamId: authResult.team_id,
          botUser: authResult.user,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Slack',
      }
    }
  },

  async disconnect(): Promise<void> {
    // Bot token revocation is handled in Slack admin
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []

    if (direction === 'outbound') {
      // Outbound sync would push notifications to Slack
      return {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors,
        duration: Date.now() - startTime,
      }
    }

    // Inbound: sync channel list and user mapping
    return {
      success: true,
      recordsProcessed: 0,
      recordsFailed: 0,
      errors,
      duration: Date.now() - startTime,
    }
  },

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const { bot_token } = config
      if (!bot_token) return false

      const result = await slackApi<{ ok: boolean }>(bot_token, 'auth.test')
      return result.ok
    } catch {
      return false
    }
  },
}

// Sync helper for channels and users
export async function syncSlackWorkspace(
  config: Record<string, string>
): Promise<{ channels: SlackChannel[]; users: SlackUser[] }> {
  const { bot_token } = config

  const [channels, users] = await Promise.all([
    fetchSlackChannels(bot_token),
    fetchSlackUsers(bot_token),
  ])

  return { channels, users }
}

// ============================================================
// Bidirectional Sync Methods
// ============================================================

// ── User Status Sync (leave status ↔ Slack status) ──────────

interface SlackUserProfile {
  status_text: string
  status_emoji: string
  status_expiration: number
}

async function getSlackUserProfile(botToken: string, userId: string): Promise<SlackUserProfile & { ok: boolean }> {
  return slackApi<{ profile: SlackUserProfile }>(botToken, 'users.profile.get', { user: userId })
    .then(data => ({ ...data.profile, ok: true }))
}

async function setSlackUserStatus(
  botToken: string,
  userId: string,
  statusText: string,
  statusEmoji: string,
  expirationTimestamp?: number
): Promise<{ ok: boolean; error?: string }> {
  const profile: Record<string, unknown> = {
    status_text: statusText,
    status_emoji: statusEmoji,
  }
  if (expirationTimestamp) {
    profile.status_expiration = expirationTimestamp
  }

  return slackApi(botToken, 'users.profile.set', {
    user: userId,
    profile: JSON.stringify(profile),
  } as unknown as SlackMessagePayload)
}

export function mapLeaveToSlackStatus(leaveType: string, endDate: string): {
  statusText: string
  statusEmoji: string
  expiration: number
} {
  const emojiMap: Record<string, string> = {
    'vacation': ':palm_tree:',
    'sick': ':face_with_thermometer:',
    'personal': ':house:',
    'parental': ':baby:',
    'bereavement': ':candle:',
    'jury_duty': ':classical_building:',
    'wfh': ':house_with_garden:',
    'conference': ':speaking_head_in_silhouette:',
  }

  const emoji = emojiMap[leaveType.toLowerCase()] || ':calendar:'
  const expiration = Math.floor(new Date(endDate).getTime() / 1000) + 86400 // end of day

  return {
    statusText: `Out of office - ${leaveType}`,
    statusEmoji: emoji,
    expiration,
  }
}

export async function syncUserStatus(
  config: Record<string, string>,
  leaveRecords: Array<{ slackUserId: string; leaveType: string; endDate: string; status: string }>
): Promise<BidiSyncResult> {
  const { bot_token } = config
  if (!bot_token) {
    return executeDemoSync('slack', 'outbound', ['userStatus'])
  }

  const startedAt = new Date().toISOString()
  let synced = 0
  let failed = 0
  const errors: BidiSyncResult['errors'] = []

  for (const leave of leaveRecords) {
    if (leave.status !== 'approved') continue

    try {
      const { statusText, statusEmoji, expiration } = mapLeaveToSlackStatus(leave.leaveType, leave.endDate)
      const result = await retryWithBackoff(() =>
        setSlackUserStatus(bot_token, leave.slackUserId, statusText, statusEmoji, expiration)
      )

      if (result.ok) {
        synced++
      } else {
        failed++
        errors.push({
          recordId: leave.slackUserId,
          entity: 'userStatus',
          message: result.error || 'Failed to set status',
          code: 'API_ERROR',
          timestamp: new Date().toISOString(),
          retryable: true,
        })
      }
    } catch (err) {
      failed++
      errors.push({
        recordId: leave.slackUserId,
        entity: 'userStatus',
        message: err instanceof Error ? err.message : 'Unknown error',
        code: 'API_ERROR',
        timestamp: new Date().toISOString(),
        retryable: true,
      })
    }
  }

  return {
    connector: 'slack',
    direction: 'outbound',
    startedAt,
    completedAt: new Date().toISOString(),
    recordsSynced: synced,
    recordsCreated: 0,
    recordsUpdated: synced,
    recordsSkipped: leaveRecords.filter(l => l.status !== 'approved').length,
    recordsFailed: failed,
    errors,
    conflicts: [],
    entityResults: [{ entity: 'userStatus', direction: 'outbound', created: 0, updated: synced, skipped: 0, failed, errors }],
  }
}

// ── Channel Message Posting (outbound) ───────────────────────

export interface SlackMessageConfig {
  channel: string
  text: string
  blocks?: Array<Record<string, unknown>>
  threadTs?: string
  unfurlLinks?: boolean
}

export async function postChannelMessage(
  config: Record<string, string>,
  message: SlackMessageConfig
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const { bot_token } = config
  if (!bot_token) {
    return { ok: true, ts: `demo-${Date.now()}` }
  }

  const payload: SlackMessagePayload = {
    channel: message.channel,
    text: message.text,
  }
  if (message.blocks) payload.blocks = message.blocks
  if (message.threadTs) payload.thread_ts = message.threadTs

  return retryWithBackoff(() =>
    slackApi(bot_token, 'chat.postMessage', payload)
  )
}

// ── Slack Event API Handler ──────────────────────────────────

export interface SlackEventPayload {
  token: string
  team_id: string
  type: 'url_verification' | 'event_callback'
  challenge?: string
  event?: {
    type: string
    user?: string
    channel?: string
    text?: string
    ts?: string
    event_ts?: string
    subtype?: string
  }
}

export async function handleSlackEvent(
  payload: string,
  signature: string,
  timestamp: string,
  signingSecret: string
): Promise<{
  verified: boolean
  challenge?: string
  event?: SlackEventPayload['event']
}> {
  // Slack uses "v0:timestamp:body" as the base string
  const baseString = `v0:${timestamp}:${payload}`
  const verified = await verifyWebhookSignature(baseString, signature.replace('v0=', ''), signingSecret, 'sha256')

  if (!verified) {
    return { verified: false }
  }

  const body: SlackEventPayload = JSON.parse(payload)

  // Handle URL verification challenge
  if (body.type === 'url_verification') {
    return { verified: true, challenge: body.challenge }
  }

  return { verified: true, event: body.event }
}

// ── Channel ↔ Department Sync ────────────────────────────────

export function mapSlackChannelToDepartment(channel: SlackChannel) {
  return {
    externalId: channel.id,
    name: channel.name,
    memberCount: channel.num_members,
    isPrivate: channel.is_private,
    source: 'slack' as const,
  }
}

export async function syncChannelsDepartments(
  config: Record<string, string>
): Promise<{
  channels: ReturnType<typeof mapSlackChannelToDepartment>[]
  raw: SlackChannel[]
}> {
  const { bot_token } = config
  if (!bot_token) {
    await executeDemoSync('slack', 'inbound', ['channels'])
    return { channels: [], raw: [] }
  }

  const raw = await retryWithBackoff(() => fetchSlackChannels(bot_token))
  return { channels: raw.map(mapSlackChannelToDepartment), raw }
}

// ── Default Sync Config ──────────────────────────────────────

export const SLACK_SYNC_CONFIG: Omit<SyncConfig, 'orgId'> = {
  connectorId: 'slack',
  direction: 'bidirectional',
  schedule: '15min',
  conflictResolution: 'source_wins',
  entities: [
    {
      sourceEntity: 'departments',
      targetEntity: 'channels',
      fieldMapping: [
        { sourceField: 'name', targetField: 'name', direction: 'inbound', required: true },
        { sourceField: 'member_count', targetField: 'num_members', direction: 'inbound', required: false },
      ] satisfies FieldMapping[],
    },
    {
      sourceEntity: 'leave_requests',
      targetEntity: 'userStatus',
      fieldMapping: [
        { sourceField: 'employee_slack_id', targetField: 'user', direction: 'outbound', required: true },
        { sourceField: 'leave_type', targetField: 'status_text', direction: 'outbound', required: true },
        { sourceField: 'end_date', targetField: 'status_expiration', direction: 'outbound', required: false },
      ] satisfies FieldMapping[],
    },
  ],
}

// ── Full bidirectional sync orchestrator ─────────────────────

export async function syncSlackBidirectional(
  config: Record<string, string>
): Promise<BidiSyncResult> {
  const { bot_token } = config
  if (!bot_token) {
    return executeDemoSync('slack', 'bidirectional', ['channels', 'users', 'userStatus'])
  }

  const startedAt = new Date().toISOString()
  const errors: BidiSyncResult['errors'] = []

  const [channelRes, userRes] = await Promise.allSettled([
    fetchSlackChannels(bot_token),
    fetchSlackUsers(bot_token),
  ])

  let totalSynced = 0
  const entityResults: BidiSyncResult['entityResults'] = []

  if (channelRes.status === 'fulfilled') {
    totalSynced += channelRes.value.length
    entityResults.push({ entity: 'channels', direction: 'inbound', created: 0, updated: channelRes.value.length, skipped: 0, failed: 0, errors: [] })
  } else {
    errors.push({ recordId: '', entity: 'channels', message: channelRes.reason?.message || 'Unknown', code: 'API_ERROR', timestamp: new Date().toISOString(), retryable: true })
    entityResults.push({ entity: 'channels', direction: 'inbound', created: 0, updated: 0, skipped: 0, failed: 1, errors: [] })
  }

  if (userRes.status === 'fulfilled') {
    totalSynced += userRes.value.length
    entityResults.push({ entity: 'users', direction: 'inbound', created: 0, updated: userRes.value.length, skipped: 0, failed: 0, errors: [] })
  } else {
    errors.push({ recordId: '', entity: 'users', message: userRes.reason?.message || 'Unknown', code: 'API_ERROR', timestamp: new Date().toISOString(), retryable: true })
    entityResults.push({ entity: 'users', direction: 'inbound', created: 0, updated: 0, skipped: 0, failed: 1, errors: [] })
  }

  return {
    connector: 'slack',
    direction: 'bidirectional',
    startedAt,
    completedAt: new Date().toISOString(),
    recordsSynced: totalSynced,
    recordsCreated: 0,
    recordsUpdated: totalSynced,
    recordsSkipped: 0,
    recordsFailed: errors.length,
    errors,
    conflicts: [],
    entityResults,
  }
}
