/**
 * Thin Claude API client used by service-layer code (cost-center
 * inference, business-purpose synthesis, etc.).
 *
 * Centralized so retry, timeout, and prompt logging live in one place.
 */

import Anthropic from '@anthropic-ai/sdk'

interface InferenceOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (_client) return _client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set')
  }
  _client = new Anthropic({ apiKey })
  return _client
}

/**
 * Run a single text inference against Claude. Returns the raw text
 * response — caller is responsible for parsing.
 */
export async function inferWithClaude(
  prompt: string,
  options: InferenceOptions = {},
): Promise<string> {
  const client = getClient()
  const response = await client.messages.create({
    model: options.model ?? 'claude-sonnet-4-5-20250929',
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.1,
    messages: [{ role: 'user', content: prompt }],
  })

  // Concatenate text blocks (typically one)
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  return text
}

/**
 * Run an image+text inference (e.g. receipt OCR). The image can be a
 * base64-encoded string or a remote URL.
 */
export async function inferWithVision(
  prompt: string,
  imageSource:
    | { type: 'base64'; data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }
    | { type: 'url'; url: string },
  options: InferenceOptions = {},
): Promise<string> {
  const client = getClient()

  const imageBlock: Anthropic.ImageBlockParam =
    imageSource.type === 'base64'
      ? {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageSource.mediaType,
            data: imageSource.data,
          },
        }
      : {
          type: 'image',
          source: { type: 'url', url: imageSource.url },
        }

  const response = await client.messages.create({
    model: options.model ?? 'claude-sonnet-4-5-20250929',
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.1,
    messages: [
      {
        role: 'user',
        content: [imageBlock, { type: 'text', text: prompt }],
      },
    ],
  })

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}
