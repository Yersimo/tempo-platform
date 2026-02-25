// ============================================================
// Slack Connector
// Send notifications, workflow alerts, and surveys via Slack
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

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
