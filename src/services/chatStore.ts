import type { Message } from '../types/chat'

const API_URL = 'http://localhost:3001/api'

export interface ChatSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
}

// ---- Chats ----

export async function fetchChats(): Promise<ChatSummary[]> {
  try {
    const res = await fetch(`${API_URL}/chats`)
    if (!res.ok) throw new Error('Failed to fetch chats')
    return res.json()
  } catch {
    console.warn('Chat server not available, using local state only')
    return []
  }
}

export async function createChat(id: string, title: string): Promise<void> {
  try {
    await fetch(`${API_URL}/chats`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, title }),
    })
  } catch {
    console.warn('Could not save chat to server')
  }
}

export async function updateChatTitle(id: string, title: string): Promise<void> {
  try {
    await fetch(`${API_URL}/chats/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    })
  } catch {
    console.warn('Could not update chat title')
  }
}

export async function deleteChat(id: string): Promise<void> {
  try {
    await fetch(`${API_URL}/chats/${id}`, { method: 'DELETE' })
  } catch {
    console.warn('Could not delete chat')
  }
}

// ---- Messages ----

export async function fetchMessages(chatId: string): Promise<Message[]> {
  try {
    const res = await fetch(`${API_URL}/chats/${chatId}/messages`)
    if (!res.ok) throw new Error('Failed to fetch messages')
    const data = await res.json()
    return data.map((m: Record<string, string>) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }))
  } catch {
    console.warn('Could not fetch messages from server')
    return []
  }
}

export async function saveMessage(chatId: string, message: Message): Promise<void> {
  try {
    await fetch(`${API_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
      }),
    })
  } catch {
    console.warn('Could not save message to server')
  }
}
