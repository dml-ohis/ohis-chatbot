import { Loader2, Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { uploadFile } from '../services/fileUpload'
import type { UploadedFile } from '../types/chat'

const ACCEPTED_TYPES = '.csv,.xlsx,.xls,.pdf,.txt,.md'

interface FileUploadButtonProps {
  onFileUploaded: (file: UploadedFile) => void
  onError?: (error: string) => void
  className?: string
}

export default function FileUploadButton({
  onFileUploaded,
  onError,
  className = '',
}: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (isUploading) return
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be re-selected
    e.target.value = ''

    setIsUploading(true)
    try {
      const uploaded = await uploadFile(file)
      onFileUploaded(uploaded)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      onError?.(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <button
        onClick={handleClick}
        disabled={isUploading}
        className={`
          flex items-center justify-center w-8 h-8 rounded-lg
          text-muted-foreground hover:text-foreground hover:bg-accent
          transition-colors duration-150 focus-ring
          disabled:pointer-events-none disabled:opacity-50
          ${className}
        `}
        aria-label={isUploading ? 'Uploading file...' : 'Attach file'}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    </>
  )
}

export { ACCEPTED_TYPES }
