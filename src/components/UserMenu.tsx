import { LogOut, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface UserMenuProps {
  userName: string | null
  onLogin: (name: string) => void
  onLogout: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function UserMenu({ userName, onLogin, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Focus input when login form opens
  useEffect(() => {
    if (isOpen && !userName && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, userName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (trimmed) {
      onLogin(trimmed)
      setNameInput('')
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors duration-150 focus-ring"
        aria-label={userName ? `Logged in as ${userName}` : 'Log in'}
      >
        {userName ? (
          <span className="text-xs font-semibold select-none">{getInitials(userName)}</span>
        ) : (
          <User className="h-4 w-4" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-lg animate-scale-in z-50 overflow-hidden">
          {userName ? (
            /* Logged in state */
            <div>
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Logged in</p>
              </div>
              <button
                onClick={() => {
                  onLogout()
                  setIsOpen(false)
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            /* Login form */
            <form onSubmit={handleSubmit} className="p-4">
              <p className="text-sm font-medium text-foreground mb-3">Sign in</p>
              <input
                ref={inputRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus-ring transition-colors duration-150"
                autoComplete="name"
              />
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 focus-ring disabled:opacity-40 disabled:pointer-events-none"
              >
                Continue
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
