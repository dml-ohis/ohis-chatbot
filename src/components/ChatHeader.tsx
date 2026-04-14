import { Moon, Sun, X } from 'lucide-react'
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
      className={`flex items-center justify-between px-5 py-4 bg-primary text-primary-foreground shrink-0 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
          <img
            src="/OHIS_logo-Blue-transparent.png"
            alt="OHIS logo"
            className="h-7 w-7 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">
            OHIS — Home Inspection Consultant
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
            <p className="text-xs opacity-80">
              Online
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-primary-foreground/15 transition-colors duration-150 focus-ring"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-primary-foreground/15 transition-colors duration-150 focus-ring"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  )
}
