interface TypingIndicatorProps {
  className?: string
}

export default function TypingIndicator({ className = '' }: TypingIndicatorProps) {
  return (
    <div className={`flex justify-start animate-fade-in ${className}`}>
      <div className="bg-chat-bot text-chat-bot-foreground rounded-lg rounded-bl-sm px-4 py-3">
        <div className="typing-dots" aria-label="Assistant is typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
