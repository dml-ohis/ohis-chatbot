import { ArrowUp, Calendar, DollarSign, HelpCircle, Info, Loader2, MapPin, Upload } from 'lucide-react'
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
    label: 'Schedule Inspection',
    icon: Calendar,
    message: 'I would like to schedule a home inspection. What are my options?',
  },
  {
    label: 'Get a Quote',
    icon: DollarSign,
    message: 'How much does a home inspection cost? Can I get a quote?',
  },
  {
    label: 'FAQs',
    icon: HelpCircle,
    message: 'What are the most frequently asked questions about home inspections?',
  },
  {
    label: 'Service Areas',
    icon: MapPin,
    message: 'What areas does OHIS serve in the Orlando region?',
  },
  {
    label: 'About OHIS',
    icon: Info,
    message: 'Tell me about Orlando Home Inspection Services (OHIS) and what makes you different.',
  },
]

interface WelcomeViewProps {
  onSend: (message: string, files?: UploadedFile[]) => void
  disabled?: boolean
  userName?: string | null
  className?: string
}

export default function WelcomeView({ onSend, disabled = false, className = '' }: WelcomeViewProps) {
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
      <div className="relative flex flex-col items-center text-center gap-4 mb-8">
        {/* Subtle ambient glow behind greeting */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <img
          src="/OHIS_logo-Blue-transparent.png"
          alt="OHIS logo"
          className="relative h-16 w-16 object-contain animate-float"
        />
        <h1 className="relative text-3xl sm:text-4xl font-light text-foreground tracking-tight">
          Welcome to{' '}
          <span className="text-gradient font-semibold">Orlando Home Inspection Services</span>
        </h1>
        <p className="relative text-base text-muted-foreground max-w-lg italic">
          We Inspect Little Details That Make A Big Difference.
        </p>
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
            placeholder="Ask about home inspections, pricing, or scheduling..."
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
