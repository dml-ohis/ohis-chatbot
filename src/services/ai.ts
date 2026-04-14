import { SYSTEM_PROMPT } from '../config/system-prompt'
import type { Message } from '../types/chat'

const API_BASE_URL = 'https://api.openanalyst.com/api'
const API_KEY = import.meta.env.VITE_OPENANALYST_API_KEY as string
const MODEL = 'openanalyst-beta'

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ApiResponse {
  content: Array<{ type: string; text: string }>
}

interface StreamOptions {
  onChunk: (text: string) => void
  onDone: (fullText: string) => void
  onError: (error: string) => void
}

/**
 * Parses an SSE stream from an Anthropic-compatible API.
 * Extracts text deltas from content_block_delta events.
 */
async function parseSSEStream(
  response: Response,
  { onChunk, onDone, onError }: StreamOptions
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    onError('Response body is not readable.')
    return
  }

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE lines from the buffer
      const lines = buffer.split('\n')
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()

        // Skip empty lines, event type lines, and comments
        if (!trimmed || trimmed.startsWith('event:') || trimmed.startsWith(':')) {
          continue
        }

        // Parse data lines
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim()

          // End of stream signal
          if (jsonStr === '[DONE]') {
            onDone(fullText)
            return
          }

          try {
            const data = JSON.parse(jsonStr)

            // Anthropic SSE format: content_block_delta contains text chunks
            if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
              const text = data.delta.text
              if (text) {
                fullText += text
                onChunk(text)
              }
            }

            // message_stop signals the end
            if (data.type === 'message_stop') {
              onDone(fullText)
              return
            }
          } catch {
            // Skip malformed JSON lines — they happen with partial chunks
          }
        }
      }
    }

    // If we exit the loop without a message_stop, the stream ended
    if (fullText) {
      onDone(fullText)
    } else {
      onError('Stream ended without producing any content.')
    }
  } catch (err) {
    if (fullText) {
      // Partial content received — deliver what we have
      onDone(fullText)
    } else {
      onError(err instanceof Error ? err.message : 'Stream reading failed.')
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Sends a message using SSE streaming. Text arrives chunk-by-chunk via onChunk.
 * Falls back to non-streaming if the stream request fails.
 */
export async function sendMessageStream(
  messages: Message[],
  options: StreamOptions,
  fileContext?: string
): Promise<void> {
  const apiMessages: ApiMessage[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))

  let systemPrompt = SYSTEM_PROMPT
  if (fileContext) {
    systemPrompt = `${SYSTEM_PROMPT}\n\n## Uploaded Data Context:\n${fileContext}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    if (!response.ok) {
      // Fall back to non-streaming on HTTP errors
      const fallbackText = await getFallbackErrorMessage(response)
      options.onError(fallbackText)
      return
    }

    // Check if the response is actually a stream (has readable body)
    if (!response.body) {
      // Not a stream — try to parse as regular JSON (fallback)
      const data: ApiResponse = await response.json()
      const textContent = data.content?.find((block) => block.type === 'text')
      if (textContent?.text) {
        options.onChunk(textContent.text)
        options.onDone(textContent.text)
      } else {
        options.onError('Received an unexpected response format.')
      }
      return
    }

    // Parse the SSE stream
    await parseSSEStream(response, options)
  } catch (error) {
    // Network errors — try non-streaming fallback
    try {
      const fallbackResponse = await sendMessageFallback(messages, fileContext)
      options.onChunk(fallbackResponse)
      options.onDone(fallbackResponse)
    } catch {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        options.onError(
          'Unable to connect to the AI service. Please check your internet connection and try again.'
        )
      } else {
        options.onError('An unexpected error occurred. Please try again.')
      }
    }
  }
}

/**
 * Non-streaming fallback — used when SSE streaming fails.
 */
async function sendMessageFallback(messages: Message[], fileContext?: string): Promise<string> {
  const apiMessages: ApiMessage[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))

  let systemPrompt = SYSTEM_PROMPT
  if (fileContext) {
    systemPrompt = `${SYSTEM_PROMPT}\n\n## Uploaded Data Context:\n${fileContext}`
  }

  const response = await fetch(`${API_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
        
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
    }),
  })

  if (!response.ok) {
    return getFallbackErrorMessage(response)
  }

  const data: ApiResponse = await response.json()
  const textContent = data.content?.find((block) => block.type === 'text')
  return textContent?.text || 'I received an unexpected response format. Please try again.'
}

/**
 * Maps HTTP status codes to user-friendly error messages.
 */
async function getFallbackErrorMessage(response: Response): Promise<string> {
  if (response.status === 429) {
    return "I'm receiving too many requests right now. Please wait a moment and try again."
  }
  if (response.status === 401 || response.status === 403) {
    return 'There was an authentication issue with the AI service. Please check the API configuration.'
  }
  if (response.status >= 500) {
    return 'The AI service is temporarily unavailable. Please try again in a few moments.'
  }
  return `Something went wrong (error ${response.status}). Please try again.`
}

/**
 * Legacy non-streaming sendMessage — kept for backward compatibility (widget mode).
 */
export async function sendMessage(messages: Message[], fileContext?: string): Promise<string> {
  return sendMessageFallback(messages, fileContext)
}
