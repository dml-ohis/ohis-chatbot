import { ArrowUp, BarChart3, FileText, GitCompare, Lightbulb, Loader2, Sparkles, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { uploadFile } from '../services/fileUpload'
import type { UploadedFile } from '../types/chat'
import FileChip from './FileChip'

const ACCEPTED_TYPES = '.csv,.xlsx,.xls,.pdf,.txt,.md'

interface QuickAction {
  label: string
  icon: React.ElementType
  message: string
  triggersUpload?: boolean
}

const quickActions: QuickAction[] = [
  {
    label: 'Upload CSV',
    icon: Upload,
    message: 'Analyze this file and give me key insights',
    triggersUpload: true,
  },
  {
    label: 'Data Analysis',
    icon: BarChart3,
    message: 'How do I analyze trends in my data?',
  },
  {
    label: 'Insights',
    icon: Lightbulb,
    message: 'What insights can you find in my uploaded data?',
  },
  {
    label: 'Compare',
    icon: GitCompare,
    message: 'Compare the key metrics across categories',
  },
  {
    label: 'Summarize',
    icon: FileText,
    message: 'Summarize the key findings from my data',
  },
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

interface WelcomeViewProps {
  onSend: (message: string, files?: UploadedFile[]) => void
  disabled?: boolean
  userName?: string | null
  className?: string
}

export default function WelcomeView({ onSend, disabled = false, userName, className = '' }: WelcomeViewProps) {
  const [value, setValue] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickUploadInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if ((!trimmed && attachedFiles.length === 0) || disabled) return
    onSend(trimmed || 'Analyze this file and give me key insights', attachedFiles.length > 0 ? attachedFiles : undefined)
    setValue('')
    setAttachedFiles([])
    setUploadError(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    setUploadError(null)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }

  const handleFileUploaded = (file: UploadedFile) => {
    setAttachedFiles((prev) => [...prev, file])
    setUploadError(null)
  }

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.fileId !== fileId))
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsUploading(true)
    try {
      const uploaded = await uploadFile(file)
      handleFileUploaded(uploaded)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleQuickUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsUploading(true)
    try {
      const uploaded = await uploadFile(file)
      // Auto-send with the analysis message
      onSend('Analyze this file and give me key insights', [uploaded])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    if (action.triggersUpload) {
      quickUploadInputRef.current?.click()
      return
    }
    onSend(action.message)
  }

  const canSend = (value.trim().length > 0 || attachedFiles.length > 0) && !disabled

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center px-4 py-8 animate-fade-in ${className}`}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={quickUploadInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleQuickUploadChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Greeting */}
      <div className="relative flex items-center gap-3 mb-8">
        {/* Subtle ambient glow behind greeting */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <Sparkles className="relative h-8 w-8 text-primary animate-float" />
        <h1 className="relative text-3xl sm:text-4xl font-light text-foreground tracking-tight">
          {getGreeting()},{' '}
          <span className="text-gradient font-semibold">{userName || 'Analyst'}</span>
        </h1>
      </div>

      {/* Input box */}
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 focus-within:border-primary focus-within:shadow-glow">
          {/* Attached files */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {attachedFiles.map((file) => (
                <FileChip
                  key={file.fileId}
                  file={file}
                  onRemove={() => handleRemoveFile(file.fileId)}
                />
              ))}
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="px-4 pt-2">
              <p className="text-xs text-destructive">{uploadError}</p>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or upload a file to analyze..."
            disabled={disabled}
            rows={2}
            className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Type your message"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50"
              aria-label={isUploading ? 'Uploading file...' : 'Attach file'}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground select-none hidden sm:inline">
                10x Analyst
              </span>
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.92] focus-ring disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-2xl stagger-children">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action)}
            disabled={disabled || isUploading}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 text-sm text-muted-foreground hover:text-foreground hover:bg-accent hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 transition-all duration-200 active:translate-y-0 active:shadow-none active:scale-[0.97] focus-ring disabled:opacity-50 disabled:pointer-events-none"
          >
            <action.icon className="h-3.5 w-3.5 transition-colors duration-200 group-hover:text-primary" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
