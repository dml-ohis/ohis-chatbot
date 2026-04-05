import { FileSpreadsheet, FileText, X } from 'lucide-react'
import type { UploadedFile } from '../types/chat'

interface FileChipProps {
  file: UploadedFile
  onRemove?: () => void
  /** Compact mode for inline use in the active files bar */
  compact?: boolean
  className?: string
}

function getFileIcon(fileType: UploadedFile['fileType']) {
  switch (fileType) {
    case 'csv':
    case 'excel':
      return FileSpreadsheet
    case 'pdf':
    case 'text':
    default:
      return FileText
  }
}

/** Returns type-specific color classes for the icon and left border accent */
function getTypeColors(fileType: UploadedFile['fileType']): {
  icon: string
  border: string
} {
  switch (fileType) {
    case 'csv':
    case 'excel':
      return { icon: 'text-success', border: 'border-l-2 border-l-success/50' }
    case 'pdf':
      return { icon: 'text-destructive', border: 'border-l-2 border-l-destructive/50' }
    case 'text':
    default:
      return { icon: 'text-info', border: 'border-l-2 border-l-info/50' }
  }
}

function truncateName(name: string, maxLen = 24): string {
  if (name.length <= maxLen) return name
  const ext = name.lastIndexOf('.')
  if (ext > 0 && name.length - ext <= 6) {
    const extStr = name.slice(ext)
    const baseTrunc = maxLen - extStr.length - 3
    return `${name.slice(0, Math.max(baseTrunc, 4))}...${extStr}`
  }
  return `${name.slice(0, maxLen - 3)}...`
}

export default function FileChip({ file, onRemove, compact = false, className = '' }: FileChipProps) {
  const Icon = getFileIcon(file.fileType)
  const colors = getTypeColors(file.fileType)

  if (compact) {
    return (
      <span
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-md
          bg-accent/40 text-xs text-foreground
          transition-all duration-150
          ${colors.border}
          ${className}
        `}
        title={file.fileName}
      >
        <Icon className={`h-3 w-3 shrink-0 ${colors.icon}`} />
        <span className="truncate max-w-[120px]">{truncateName(file.fileName, 18)}</span>
      </span>
    )
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        bg-accent/50 border border-border text-sm text-foreground
        transition-all duration-150 animate-scale-in
        hover:bg-accent hover:shadow-xs
        ${colors.border}
        ${className}
      `}
      title={file.fileName}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${colors.icon}`} />
      <span className="truncate max-w-[160px]">{truncateName(file.fileName)}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 focus-ring ml-0.5"
          aria-label={`Remove ${file.fileName}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
