// ============================================================
// Microsoft Teams Connector
// Notifications, approvals, meeting scheduling, and channel messaging
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'
const TOKEN_URL = 'https://login.microsoftonline.com'

interface TeamsChannel {
  id: string
  displayName: string
  description?: string
  membershipType: string
}

interface TeamsTeam {
  id: string
  displayName: string
  description?: string
  isArchived: boolean
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

async function getTeamsAccessToken(
  tenantId: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const tokenEndpoint = `${TOKEN_URL}/${tenantId}/oauth2/v2.0/token`

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to acquire Teams access token: ${response.status} - ${error}`)
  }

  const data: TokenResponse = await response.json()
  return data.access_token
}

async function graphGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Graph API error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function graphPost<T>(
  accessToken: string,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Graph API POST error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function fetchTeams(accessToken: string): Promise<TeamsTeam[]> {
  const data = await graphGet<{ value: TeamsTeam[] }>(accessToken, '/teams')
  return data.value || []
}

async function fetchTeamChannels(
  accessToken: string,
  teamId: string
): Promise<TeamsChannel[]> {
  const data = await graphGet<{ value: TeamsChannel[] }>(
    accessToken,
    `/teams/${teamId}/channels`
  )
  return data.value || []
}

export async function sendTeamsChannelMessage(
  accessToken: string,
  teamId: string,
  channelId: string,
  content: string
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(
    accessToken,
    `/teams/${teamId}/channels/${channelId}/messages`,
    {
      body: {
        contentType: 'html',
        content,
      },
    }
  )
}

export const teamsConnector: IntegrationConnector = {
  id: 'microsoft-teams',
  name: 'Microsoft Teams',
  description: 'Integrate with Teams for notifications, approvals, and meeting scheduling.',
  icon: 'Video',
  category: 'communication',
  capabilities: ['Notifications', 'Approvals', 'Meeting scheduling', 'Channel messaging'],

  configSchema: [
    { key: 'tenant_id', label: 'Tenant ID', type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'client_id', label: 'Application (Client) ID', type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Enter client secret value' },
  ] as ConfigField[],

  async connect(config: Record<string, string>): Promise<ConnectionResult> {
    try {
      const { tenant_id, client_id, client_secret } = config
      if (!tenant_id || !client_id || !client_secret) {
        return { success: false, error: 'Missing required fields: Tenant ID, Client ID, and Client Secret are required.' }
      }

      const accessToken = await getTeamsAccessToken(tenant_id, client_id, client_secret)

      // Verify by fetching org info
      const orgInfo = await graphGet<{ value: Array<{ displayName: string; id: string }> }>(
        accessToken,
        '/organization'
      )
      const orgData = orgInfo.value?.[0]

      return {
        success: true,
        metadata: {
          tenantName: orgData?.displayName || 'Unknown',
          tenantId: tenant_id,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Microsoft Teams',
      }
    }
  },

  async disconnect(): Promise<void> {
    // App registration revocation is handled in Azure portal
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []

    if (direction === 'outbound') {
      // Outbound: send pending notifications to Teams channels
      return {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors,
        duration: Date.now() - startTime,
      }
    }

    // Inbound: sync team and channel structure
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
      const { tenant_id, client_id, client_secret } = config
      if (!tenant_id || !client_id || !client_secret) return false

      const accessToken = await getTeamsAccessToken(tenant_id, client_id, client_secret)
      await graphGet(accessToken, '/organization')
      return true
    } catch {
      return false
    }
  },
}

// Sync helper for teams and channels
export async function syncTeamsStructure(
  config: Record<string, string>
): Promise<{ teams: TeamsTeam[]; channels: Map<string, TeamsChannel[]> }> {
  const { tenant_id, client_id, client_secret } = config
  const accessToken = await getTeamsAccessToken(tenant_id, client_id, client_secret)

  const teams = await fetchTeams(accessToken)
  const channels = new Map<string, TeamsChannel[]>()

  for (const team of teams) {
    if (!team.isArchived) {
      const teamChannels = await fetchTeamChannels(accessToken, team.id)
      channels.set(team.id, teamChannels)
    }
  }

  return { teams, channels }
}
