import { Bot, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ChatHeaderProps {
  onClose?: () => void
  className?: string
}

export default function ChatHeader({ onClose, className = '' }: ChatHeaderProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <header
      className={`flex items-center justify-between px-4 py-3 bg-card border-b border-border ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground leading-tight">
            PM Assistant
          </h1>
          <p className="text-xs text-muted-foreground">
            Product management expert
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  )
}
