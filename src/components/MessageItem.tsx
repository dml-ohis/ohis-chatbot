import { useState, useCallback } from 'react'
import { Bot, Copy, Check } from 'lucide-react'
import type { Message } from '../types/chat'
import FileChip from './FileChip'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Block-level types                                                   */
/* ------------------------------------------------------------------ */

type Block =
  | { type: 'code'; language: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'text'; lines: string[] }

/* ------------------------------------------------------------------ */
/*  Parse message content into blocks                                   */
/* ------------------------------------------------------------------ */

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // --- Fenced code block ---
    const codeMatch = line.match(/^```(\w*)/)
    if (codeMatch) {
      const language = codeMatch[1] || 'text'
      const codeLines: string[] = []
      i++ // skip opening fence
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push({ type: 'code', language, code: codeLines.join('\n') })
      continue
    }

    // --- Markdown table ---
    // A table starts with a | line, followed by a separator |---|---|
    if (
      line.trim().startsWith('|') &&
      i + 1 < lines.length &&
      /^\|[\s-:|]+\|$/.test(lines[i + 1].trim())
    ) {
      const headerCells = parseCells(line)
      i += 2 // skip header + separator
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseCells(lines[i]))
        i++
      }
      blocks.push({ type: 'table', headers: headerCells, rows })
      continue
    }

    // --- Regular text line — accumulate contiguous text ---
    const textLines: string[] = []
    while (i < lines.length) {
      const cur = lines[i]
      // Break if we hit a code fence or table start
      if (cur.match(/^```/)) break
      if (
        cur.trim().startsWith('|') &&
        i + 1 < lines.length &&
        /^\|[\s-:|]+\|$/.test(lines[i + 1].trim())
      )
        break
      textLines.push(cur)
      i++
    }
    if (textLines.length > 0) {
      blocks.push({ type: 'text', lines: textLines })
    }
  }

  return blocks
}

function parseCells(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1) // remove leading/trailing empty splits
    .map((c) => c.trim())
}

/* ------------------------------------------------------------------ */
/*  Inline formatting parser (bold, italic, inline code, links)         */
/* ------------------------------------------------------------------ */

function parseInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  // Match **bold**, *italic*, `code`, and URLs
  const regex =
    /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|(https?:\/\/[^\s<>"')\]]+))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      result.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // *italic*
      result.push(
        <em key={match.index} className="italic">
          {match[3]}
        </em>
      )
    } else if (match[4]) {
      // `inline code`
      result.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-muted text-foreground text-sm font-mono"
        >
          {match[4]}
        </code>
      )
    } else if (match[5]) {
      // URL link
      const url = match[5]
      const displayText =
        url.length > 50 ? url.slice(0, 47) + '...' : url
      result.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
          aria-label={`Open link: ${url}`}
        >
          {displayText}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex))
  }

  return result.length > 0 ? result : [text]
}

/* ------------------------------------------------------------------ */
/*  Text block renderer (headings, bullets, paragraphs)                 */
/* ------------------------------------------------------------------ */

function renderTextLines(lines: string[], keyPrefix: string) {
  return lines.map((line, idx) => {
    const key = `${keyPrefix}-${idx}`
    const isBullet = /^\s*[-*]\s/.test(line)
    const isNumbered = /^\s*\d+[.)]\s/.test(line)

    // Heading levels
    const h3Match = /^###\s+(.*)/.exec(line)
    const h2Match = /^##\s+(.*)/.exec(line)
    const h1Match = /^#\s+(.*)/.exec(line)

    if (h3Match) {
      return (
        <p
          key={key}
          className="text-sm font-semibold uppercase tracking-wide text-foreground mt-3 mb-1"
        >
          {parseInline(h3Match[1])}
        </p>
      )
    }
    if (h2Match) {
      return (
        <p
          key={key}
          className="text-base font-semibold text-foreground mt-3 mb-1"
        >
          {parseInline(h2Match[1])}
        </p>
      )
    }
    if (h1Match) {
      return (
        <p
          key={key}
          className="text-lg font-bold text-foreground mt-3 mb-1"
        >
          {parseInline(h1Match[1])}
        </p>
      )
    }

    if (isBullet || isNumbered) {
      return (
        <p key={key} className="pl-4 py-0.5">
          {parseInline(line)}
        </p>
      )
    }

    if (line.trim() === '') {
      return <br key={key} />
    }

    return (
      <p key={key} className="py-0.5">
        {parseInline(line)}
      </p>
    )
  })
}

/* ------------------------------------------------------------------ */
/*  Code block component with copy button                               */
/* ------------------------------------------------------------------ */

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  return (
    <div className="relative group my-3 rounded-lg border border-border bg-muted overflow-hidden">
      {/* Header bar with language + copy */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground
                     transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-2 py-1
                     hover:bg-accent active:scale-[0.98]"
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="px-4 py-3 text-sm leading-relaxed">
          <code className="font-mono text-foreground/90">{code}</code>
        </pre>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Table block component                                               */
/* ------------------------------------------------------------------ */

function MarkdownTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-foreground border-b border-border"
              >
                {parseInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="transition-colors duration-150 hover:bg-accent/50"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-3 py-2 text-foreground/90 border-b border-border/50"
                >
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Render all blocks                                                   */
/* ------------------------------------------------------------------ */

function renderFormattedContent(text: string) {
  const blocks = parseBlocks(text)

  return blocks.map((block, idx) => {
    const key = `block-${idx}`

    switch (block.type) {
      case 'code':
        return (
          <CodeBlock key={key} language={block.language} code={block.code} />
        )
      case 'table':
        return (
          <MarkdownTable
            key={key}
            headers={block.headers}
            rows={block.rows}
          />
        )
      case 'text':
        return (
          <div key={key}>{renderTextLines(block.lines, key)}</div>
        )
    }
  })
}

/* ------------------------------------------------------------------ */
/*  MessageItem component                                               */
/* ------------------------------------------------------------------ */

export default function MessageItem({
  message,
  isStreaming = false,
  className = '',
}: MessageItemProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`animate-fade-in ${className}`}>
      {/* Label row */}
      <div className="flex items-center gap-2 mb-1.5">
        {!isUser && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
        <span className="text-sm font-semibold text-foreground">
          {isUser ? 'You' : '10x Analyst'}
        </span>
      </div>

      {/* Attached files (shown for user messages that had files) */}
      {isUser && message.attachedFiles && message.attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 pl-0">
          {message.attachedFiles.map((file) => (
            <FileChip key={file.fileId} file={file} />
          ))}
        </div>
      )}

      {/* Message content — rendered directly (streaming delivers text progressively) */}
      <div
        className={`
          text-sm leading-relaxed
          ${isUser ? 'text-foreground pl-0' : 'text-foreground/90 pl-8'}
        `}
      >
        {renderFormattedContent(message.content)}
        {/* Blinking cursor while streaming is active */}
        {isStreaming && !isUser && (
          <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse-soft align-text-bottom" />
        )}
      </div>
    </div>
  )
}
