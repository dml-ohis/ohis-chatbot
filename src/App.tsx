import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import type { Message, UploadedFile } from './types/chat'
import { sendMessageStream } from './services/ai'
import { fetchChatFiles } from './services/fileUpload'
import {
  fetchChats,
  createChat,
  updateChatTitle,
  deleteChat as deleteChatApi,
  fetchMessages,
  saveMessage,
  type ChatSummary,
} from './services/chatStore'
import Sidebar from './components/Sidebar'
import WelcomeView from './components/WelcomeView'
import ConversationView from './components/ConversationView'
import UserMenu from './components/UserMenu'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function App() {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeFiles, setActiveFiles] = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem('pm-chatbot-user')
  })

  // Sync dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Load chats from server on mount
  useEffect(() => {
    fetchChats().then(setChats)
  }, [])

  // Load messages and files when active chat changes
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId).then(setMessages)
      fetchChatFiles(activeChatId).then(setActiveFiles)
    } else {
      setMessages([])
      setActiveFiles([])
    }
  }, [activeChatId])

  const handleSend = useCallback(
    async (content: string, files?: UploadedFile[]) => {
      let chatId = activeChatId

      // If no active chat, create one
      if (!chatId) {
        chatId = generateId()
        const title = content.length > 40 ? content.slice(0, 40) + '...' : content
        await createChat(chatId, title)
        setActiveChatId(chatId)
        const updatedChats = await fetchChats()
        setChats(updatedChats)
      }

      // Track files attached to this message
      const messageFiles = files || undefined

      // Add new files to active files for context
      if (files && files.length > 0) {
        setActiveFiles((prev) => {
          const existingIds = new Set(prev.map((f) => f.fileId))
          const newFiles = files.filter((f) => !existingIds.has(f.fileId))
          return [...prev, ...newFiles]
        })
      }

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachedFiles: messageFiles,
      }

      setMessages((prev) => [...prev, userMessage])
      await saveMessage(chatId!, userMessage)
      setIsLoading(true)

      // Create assistant message immediately with empty content
      const assistantId = generateId()
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      // Capture chatId for closures
      const currentChatId = chatId!

      const allMessages = [...messages, userMessage]

      // Build file context from all active files (including newly attached)
      const allActiveFiles = files
        ? [...activeFiles.filter((f) => !files.some((nf) => nf.fileId === f.fileId)), ...files]
        : activeFiles

      let fileContext: string | undefined
      if (allActiveFiles.length > 0) {
        fileContext = allActiveFiles
          .map((f) => `### File: ${f.fileName} (${f.fileType})\n${f.summary}\n\n${f.data}`)
          .join('\n\n---\n\n')
      }

      await sendMessageStream(
        allMessages,
        {
          onChunk: (text: string) => {
            // On first chunk, add the assistant message and switch from loading to streaming
            setIsLoading(false)
            setStreamingMessageId(assistantId)
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantId)
              if (!existing) {
                // First chunk — add the message to the list
                return [...prev, { ...assistantMessage, content: text }]
              }
              // Subsequent chunks — append text to the existing message
              return prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + text } : m
              )
            })
          },
          onDone: async (fullText: string) => {
            setIsLoading(false)
            setStreamingMessageId(null)

            // Ensure the final message has the complete text
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: fullText } : m
              )
            )

            // Save the complete message to the database
            await saveMessage(currentChatId, {
              ...assistantMessage,
              content: fullText,
            })

            // Update chat title if this was the first message
            if (messages.length === 0) {
              const title = content.length > 40 ? content.slice(0, 40) + '...' : content
              await updateChatTitle(currentChatId, title)
              const updatedChats = await fetchChats()
              setChats(updatedChats)
            }
          },
          onError: async (errorText: string) => {
            setIsLoading(false)
            setStreamingMessageId(null)

            const errorContent = errorText || 'Sorry, I encountered an error while processing your request. Please try again.'

            // Show the error as an assistant message
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantId)
              if (!existing) {
                return [...prev, { ...assistantMessage, content: errorContent }]
              }
              return prev.map((m) =>
                m.id === assistantId ? { ...m, content: errorContent } : m
              )
            })

            await saveMessage(currentChatId, {
              ...assistantMessage,
              content: errorContent,
            })
          },
        },
        fileContext
      )
    },
    [messages, activeChatId, activeFiles]
  )

  const handleLogin = (name: string) => {
    setUserName(name)
    localStorage.setItem('pm-chatbot-user', name)
  }

  const handleLogout = () => {
    setUserName(null)
    localStorage.removeItem('pm-chatbot-user')
  }

  // Close sidebar only on mobile (< lg breakpoint)
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  const handleNewChat = () => {
    setActiveChatId(null)
    setMessages([])
    setActiveFiles([])
    closeSidebarOnMobile()
  }

  const handleSelectChat = async (id: string) => {
    setActiveChatId(id)
    closeSidebarOnMobile()
  }

  const handleDeleteChat = async (id: string) => {
    await deleteChatApi(id)
    const updatedChats = await fetchChats()
    setChats(updatedChats)
    if (activeChatId === id) {
      setActiveChatId(null)
      setMessages([])
      setActiveFiles([])
    }
  }

  const hasMessages = messages.length > 0

  // Track view transition: 'welcome' | 'fading' | 'conversation'
  const [viewState, setViewState] = useState<'welcome' | 'fading' | 'conversation'>(
    hasMessages ? 'conversation' : 'welcome'
  )
  const prevHasMessages = useRef(hasMessages)

  useEffect(() => {
    // Transitioning from welcome → conversation (first message sent)
    if (hasMessages && !prevHasMessages.current) {
      setViewState('fading')
      const timer = setTimeout(() => setViewState('conversation'), 300)
      return () => clearTimeout(timer)
    }
    // Transitioning back to welcome (new chat)
    if (!hasMessages && prevHasMessages.current) {
      setViewState('welcome')
    }
    prevHasMessages.current = hasMessages
  }, [hasMessages])

  // Also handle direct navigation to a chat with messages
  useEffect(() => {
    if (hasMessages) setViewState('conversation')
    else setViewState('welcome')
  }, [activeChatId])

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        recentChats={chats.map((c) => ({ id: c.id, title: c.title }))}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring lg:hidden"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-foreground lg:hidden">
              OHIS
            </span>
          </div>

          <UserMenu
            userName={userName}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </header>

        {/* Content — smooth cross-fade between welcome and conversation */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Welcome view */}
          {viewState !== 'conversation' && (
            <div
              className={`absolute inset-0 z-10 transition-all duration-300 ease-out ${
                viewState === 'fading'
                  ? 'opacity-0 scale-[0.98] pointer-events-none'
                  : 'opacity-100 scale-100'
              }`}
            >
              <WelcomeView onSend={handleSend} disabled={isLoading} userName={userName} />
            </div>
          )}

          {/* Conversation view */}
          {(viewState === 'conversation' || viewState === 'fading') && hasMessages && (
            <div
              className={`flex-1 flex flex-col min-h-0 transition-opacity duration-300 ease-out ${
                viewState === 'fading' ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <ConversationView
                messages={messages}
                isLoading={isLoading}
                streamingMessageId={streamingMessageId}
                activeFiles={activeFiles}
                onSend={handleSend}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
