import type { Message } from '../types/chat'

interface MessageBubbleProps {
  message: Message
  className?: string
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export default function MessageBubble({ message, className = '' }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up ${className}`}
    >
      <div className={`max-w-[80%] sm:max-w-[70%] ${isUser ? 'order-1' : 'order-1'}`}>
        <div
          className={`
            px-4 py-2.5 text-sm leading-relaxed
            ${
              isUser
                ? 'bg-chat-user text-chat-user-foreground rounded-lg rounded-br-sm'
                : 'bg-chat-bot text-chat-bot-foreground rounded-lg rounded-bl-sm'
            }
          `}
        >
          {message.content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
        <p
          className={`mt-1 text-xs text-muted-foreground ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
