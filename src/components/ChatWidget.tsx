import { MessageCircle, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Message } from '../types/chat'
import { sendMessage } from '../services/ai'
import ChatHeader from './ChatHeader'
import ChatWindow from './ChatWindow'
import ChatInput from './ChatInput'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your Product Management assistant. Ask me anything about product strategy, roadmaps, prioritization, user research, agile methodologies, and more. How can I help you today?",
  timestamp: new Date(),
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface ChatWidgetProps {
  className?: string
}

export default function ChatWidget({ className = '' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const allMessages = [...messages, userMessage]
        const responseText = await sendMessage(allMessages)

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content:
            'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [messages]
  )

  return (
    <div className={className}>
      {/* Chat popup */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-[380px] h-[520px] max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0 rounded-xl max-sm:rounded-none shadow-xl border border-border bg-background flex flex-col overflow-hidden animate-scale-in z-50"
          role="dialog"
          aria-label="PM Assistant chat"
        >
          <ChatHeader onClose={() => setIsOpen(false)} />
          <ChatWindow messages={messages} isLoading={isLoading} />
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      )}

      {/* Floating action button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elegant flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-glow active:scale-95 focus-ring z-50 animate-scale-in"
          aria-label="Open PM Assistant chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Close overlay button (visible only when open, on mobile the X in header handles it) */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-muted text-muted-foreground shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus-ring z-50 max-sm:hidden"
          aria-label="Close PM Assistant chat"
        >
          <X className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
