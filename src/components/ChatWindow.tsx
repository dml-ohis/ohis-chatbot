import { useEffect, useRef } from 'react'
import type { Message } from '../types/chat'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { Calendar, ClipboardList, HelpCircle } from 'lucide-react'

interface ChatWindowProps {
  messages: Message[]
  isLoading: boolean
  className?: string
}

function StarterPrompts() {
  return (
    <div className="px-5 pb-5 pt-1 animate-fade-in">
      <p className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase mb-3 px-1">
        Try these
      </p>
      <div className="space-y-2">
        {[
          { icon: Calendar, text: 'Schedule a home inspection' },
          { icon: ClipboardList, text: 'Learn what a home inspection covers' },
          { icon: HelpCircle, text: 'Get answers to common questions' },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border text-left transition-colors duration-150 hover:bg-accent/50"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-foreground">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChatWindow({ messages, isLoading, className = '' }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isWelcomeOnly = messages.length === 1 && messages[0].id === 'welcome'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div
        ref={scrollRef}
        className={`flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto chat-scrollbar bg-background ${className}`}
      >
        <div className="text-center max-w-sm animate-fade-in-up">
          <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-2xl bg-primary text-primary-foreground mb-4">
            <img
              src="/OHIS_logo-Blue-transparent.png"
              alt="OHIS logo"
              className="h-9 w-9 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            OHIS — Home Inspection Consultant
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your personal guide to home inspections, pricing, and scheduling.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto chat-scrollbar bg-background flex flex-col ${className}`}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      <div className="px-5 pt-5 pb-3 space-y-4 flex-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>

      {isWelcomeOnly && !isLoading && <StarterPrompts />}
    </div>
  )
}
