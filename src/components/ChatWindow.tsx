import { useEffect, useRef } from 'react'
import type { Message } from '../types/chat'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { Bot } from 'lucide-react'

interface ChatWindowProps {
  messages: Message[]
  isLoading: boolean
  className?: string
}

export default function ChatWindow({ messages, isLoading, className = '' }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div
        ref={scrollRef}
        className={`flex-1 flex items-center justify-center p-6 overflow-y-auto chat-scrollbar bg-background ${className}`}
      >
        <div className="text-center max-w-sm animate-fade-in-up">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-primary/10 mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Welcome to PM Assistant
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your AI product management expert. Ask me anything about product strategy, roadmaps,
            prioritization, user research, agile methods, and more.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto p-4 space-y-3 chat-scrollbar bg-background ${className}`}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <TypingIndicator />}
    </div>
  )
}
