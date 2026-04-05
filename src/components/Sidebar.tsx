import {
  Plus,
  Search,
  Settings,
  MessageCircle,
  Folder,
  BookOpen,
  PanelLeft,
  Moon,
  Sun,
  Trash2,
} from 'lucide-react'

interface RecentChat {
  id: string
  title: string
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewChat: () => void
  recentChats: RecentChat[]
  activeChatId?: string | null
  onSelectChat?: (id: string) => void
  onDeleteChat?: (id: string) => void
  isDark: boolean
  onToggleTheme: () => void
  className?: string
}

const navItems = [
  { icon: Plus, label: 'New chat', action: 'new-chat' },
  { icon: Search, label: 'Search', action: 'search' },
  { icon: Settings, label: 'Customize', action: 'customize' },
]

const navSections = [
  { icon: MessageCircle, label: 'Chats', action: 'chats' },
  { icon: Folder, label: 'Projects', action: 'projects' },
  { icon: BookOpen, label: 'Knowledge Base', action: 'knowledge' },
]

export default function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  recentChats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  isDark,
  onToggleTheme,
  className = '',
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay — only renders on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col
          bg-card border-r border-border
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:z-auto lg:shrink-0
          ${className}
        `}
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            10x Analyst
          </h2>
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring lg:hidden"
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Nav */}
        <nav className="px-2 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.action}
              onClick={item.action === 'new-chat' ? onNewChat : undefined}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}

          {/* Divider */}
          <div className="border-t border-border my-2" />

          {navSections.map((item) => (
            <button
              key={item.action}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Recents */}
        <div className="flex-1 overflow-y-auto mt-4 px-2 chat-scrollbar">
          <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recents
          </p>
          <div className="space-y-0.5 mt-1">
            {recentChats.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground/60 italic">
                No conversations yet
              </p>
            )}
            {recentChats.map((chat) => {
              const isActive = chat.id === activeChatId
              return (
                <div
                  key={chat.id}
                  className={`group flex items-center rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <button
                    onClick={() => onSelectChat?.(chat.id)}
                    className="flex-1 text-left px-3 py-2 text-sm truncate focus-ring rounded-lg"
                  >
                    <span className="truncate">{chat.title}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteChat?.(chat.id)
                    }}
                    className="hidden group-hover:flex items-center justify-center w-7 h-7 mr-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150 focus-ring"
                    aria-label={`Delete chat: ${chat.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer — theme toggle */}
        <div className="px-2 py-3 border-t border-border">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="h-4 w-4 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" />
            )}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
