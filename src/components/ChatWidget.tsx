import { X } from 'lucide-react'
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
    "Hi! I'm your OHIS virtual consultant — your personal home inspection guide. Ask me about inspections, pricing, scheduling, or our service areas.",
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
            'Sorry, I encountered an error. Please try again.',
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
    <div className={className} style={{ pointerEvents: 'auto' }}>
      {/* Chat popup */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-[400px] h-[560px] max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0 max-sm:rounded-none bg-background flex flex-col animate-scale-in z-[99998]"
          role="dialog"
          aria-label="OHIS chat"
          style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)' }}
        >
          <ChatHeader onClose={() => setIsOpen(false)} />
          <ChatWindow messages={messages} isLoading={isLoading} />
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-elegant flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus-ring z-[99999] ${
          isOpen
            ? 'bg-muted text-muted-foreground hover:bg-accent'
            : 'bg-primary text-primary-foreground hover:shadow-glow'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open OHIS chat'}
        style={{ pointerEvents: 'auto' }}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <img
            src="/OHIS_logo-Blue-transparent.png"
            alt="OHIS"
            className="h-8 w-8 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        )}
      </button>
    </div>
  )
}
