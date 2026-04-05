export interface UploadedFile {
  fileId: string
  fileName: string
  fileType: 'csv' | 'excel' | 'pdf' | 'text'
  summary: string
  data: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachedFiles?: UploadedFile[]
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}
