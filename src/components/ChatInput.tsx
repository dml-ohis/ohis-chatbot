import { ArrowUp } from 'lucide-react'
import { useRef, useState } from 'react'
import type { UploadedFile } from '../types/chat'
import FileUploadButton from './FileUploadButton'
import FileChip from './FileChip'

interface ChatInputProps {
  onSend: (message: string, files?: UploadedFile[]) => void
  disabled?: boolean
  className?: string
}

export default function ChatInput({ onSend, disabled = false, className = '' }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const canSend = (value.trim().length > 0 || attachedFiles.length > 0) && !disabled

  return (
    <div className={`w-full max-w-3xl mx-auto px-4 pb-4 ${className}`}>
      <div className="rounded-2xl border border-border bg-card overflow-hidden transition-colors duration-150 focus-within:border-ring">
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

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or upload a file to analyze..."
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Type your message"
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          <FileUploadButton
            onFileUploaded={handleFileUploaded}
            onError={(msg) => setUploadError(msg)}
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground select-none hidden sm:inline">
              10x Analyst
            </span>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.95] focus-ring disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground text-center">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  )
}

export { ChatInput }
