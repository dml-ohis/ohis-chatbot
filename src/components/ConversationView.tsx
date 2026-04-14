import { useEffect, useRef, useState } from 'react'
import { Sparkles, Paperclip, ChevronDown, ChevronUp } from 'lucide-react'
import type { Message, UploadedFile } from '../types/chat'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import FileChip from './FileChip'

interface ConversationViewProps {
  messages: Message[]
  isLoading: boolean
  streamingMessageId?: string | null
  activeFiles?: UploadedFile[]
  onSend: (message: string, files?: UploadedFile[]) => void
  className?: string
}

export default function ConversationView({
  messages,
  isLoading,
  streamingMessageId,
  activeFiles = [],
  onSend,
  className = '',
}: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [filesExpanded, setFilesExpanded] = useState(false)

  // Auto-scroll when messages change, when streaming updates content, or when loading
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, isLoading])

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${className}`}>
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto chat-scrollbar"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isStreaming={message.id === streamingMessageId}
            />
          ))}

          {/* Thinking indicator — shown while waiting for first chunk */}
          {isLoading && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-spin-slow" />
                </div>
                <span className="text-sm font-semibold text-foreground">OHIS</span>
              </div>
              <div className="pl-8">
                <div className="thinking-indicator" aria-label="OHIS is thinking">
                  <div className="thinking-shimmer-bar" />
                  <span className="text-sm text-muted-foreground animate-pulse-soft">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active files indicator bar */}
      {activeFiles.length > 0 && (
        <div className="bg-card/50 border-t border-border animate-fade-in">
          <button
            onClick={() => setFilesExpanded(!filesExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 focus-ring"
            aria-expanded={filesExpanded}
            aria-controls="active-files-list"
          >
            <div className="flex items-center gap-2">
              <Paperclip className="h-3.5 w-3.5" />
              <span>
                {activeFiles.length} file{activeFiles.length !== 1 ? 's' : ''} loaded for context
              </span>
            </div>
            {filesExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>

          {filesExpanded && (
            <div
              id="active-files-list"
              className="px-4 pb-2 flex flex-wrap gap-1.5 animate-fade-in"
            >
              {activeFiles.map((file) => (
                <FileChip key={file.fileId} file={file} compact />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isLoading || !!streamingMessageId} />
    </div>
  )
}
