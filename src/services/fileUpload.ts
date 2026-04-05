import type { UploadedFile } from '../types/chat'

const API_URL = 'http://localhost:3001/api'

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Upload failed')
    throw new Error(errorText || `Upload failed with status ${res.status}`)
  }

  return res.json()
}

export async function fetchChatFiles(chatId: string): Promise<UploadedFile[]> {
  try {
    const res = await fetch(`${API_URL}/chats/${chatId}/files`)
    if (!res.ok) return []
    return res.json()
  } catch {
    console.warn('Could not fetch chat files from server')
    return []
  }
}
