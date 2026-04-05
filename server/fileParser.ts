import fs from 'fs'
import path from 'path'
import { parse as csvParse } from 'csv-parse/sync'
import * as XLSX from 'xlsx'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

export interface ParsedFile {
  fileName: string
  fileType: 'csv' | 'excel' | 'pdf' | 'text'
  summary: string
  data: string
  rowCount?: number
  columnNames?: string[]
}

const MAX_ROWS = 500
const PREVIEW_ROWS = 20

/**
 * Format tabular data as markdown table (first N rows) + pipe-delimited full data.
 */
function formatTabularData(
  rows: Record<string, unknown>[],
  columns: string[],
  totalRowCount: number
): string {
  // Markdown preview table (first 20 rows)
  const previewRows = rows.slice(0, PREVIEW_ROWS)
  const headerLine = `| ${columns.join(' | ')} |`
  const separatorLine = `| ${columns.map(() => '---').join(' | ')} |`
  const dataLines = previewRows.map(
    (row) => `| ${columns.map((col) => String(row[col] ?? '')).join(' | ')} |`
  )

  let markdown = [headerLine, separatorLine, ...dataLines].join('\n')
  if (totalRowCount > PREVIEW_ROWS) {
    markdown += `\n\n_Showing ${PREVIEW_ROWS} of ${totalRowCount} rows in preview._`
  }

  // Full data as pipe-delimited text
  const fullHeader = columns.join('|')
  const fullRows = rows.map((row) =>
    columns.map((col) => String(row[col] ?? '')).join('|')
  )
  const fullData = [fullHeader, ...fullRows].join('\n')

  return `## Data Preview\n\n${markdown}\n\n## Full Data (pipe-delimited)\n\n${fullData}`
}

/**
 * Generate summary string for tabular data.
 */
function tabulaSummary(
  fileType: string,
  totalRows: number,
  shownRows: number,
  columns: string[]
): string {
  const colList = columns.slice(0, 10).join(', ')
  const colSuffix = columns.length > 10 ? `, ... (${columns.length} total)` : ''
  const truncNote =
    shownRows < totalRows
      ? ` (showing first ${shownRows} of ${totalRows} rows)`
      : ''
  return `${fileType.toUpperCase()} with ${totalRows} rows and ${columns.length} columns: ${colList}${colSuffix}${truncNote}`
}

/**
 * Parse a CSV file.
 */
function parseCsv(filePath: string, fileName: string): ParsedFile {
  const content = fs.readFileSync(filePath, 'utf-8')
  const allRows: Record<string, unknown>[] = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  })

  const totalCount = allRows.length
  const rows = allRows.slice(0, MAX_ROWS)
  const columns = allRows.length > 0 ? Object.keys(allRows[0]) : []

  return {
    fileName,
    fileType: 'csv',
    summary: tabulaSummary('CSV', totalCount, rows.length, columns),
    data: formatTabularData(rows, columns, rows.length),
    rowCount: totalCount,
    columnNames: columns,
  }
}

/**
 * Parse an Excel file (.xlsx, .xls).
 */
function parseExcel(filePath: string, fileName: string): ParsedFile {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const allRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

  const totalCount = allRows.length
  const rows = allRows.slice(0, MAX_ROWS)
  const columns = allRows.length > 0 ? Object.keys(allRows[0]) : []

  return {
    fileName,
    fileType: 'excel',
    summary: tabulaSummary('Excel', totalCount, rows.length, columns),
    data: formatTabularData(rows, columns, rows.length),
    rowCount: totalCount,
    columnNames: columns,
  }
}

/**
 * Parse a PDF file.
 */
async function parsePdf(filePath: string, fileName: string): Promise<ParsedFile> {
  const buffer = fs.readFileSync(filePath)
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const text = (await parser.getText()).trim()
  const info = await parser.getInfo()
  const pageCount = info?.numPages || 1
  const previewText = text.slice(0, 200)
  const summary = `PDF with ${pageCount} page${pageCount !== 1 ? 's' : ''}. Preview: ${previewText}${text.length > 200 ? '...' : ''}`

  return {
    fileName,
    fileType: 'pdf',
    summary,
    data: text,
  }
}

/**
 * Parse a plain text or markdown file.
 */
function parseText(filePath: string, fileName: string): ParsedFile {
  const text = fs.readFileSync(filePath, 'utf-8')
  const lineCount = text.split('\n').length
  const previewText = text.slice(0, 200)
  const summary = `Text file with ${lineCount} lines. Preview: ${previewText}${text.length > 200 ? '...' : ''}`

  return {
    fileName,
    fileType: 'text',
    summary,
    data: text,
  }
}

/**
 * Determine file type from extension and MIME type.
 */
function getFileCategory(
  ext: string,
  _mimeType: string
): 'csv' | 'excel' | 'pdf' | 'text' | null {
  const lower = ext.toLowerCase()
  if (lower === '.csv') return 'csv'
  if (lower === '.xlsx' || lower === '.xls') return 'excel'
  if (lower === '.pdf') return 'pdf'
  if (lower === '.txt' || lower === '.md') return 'text'
  return null
}

/**
 * Parse an uploaded file and return structured data.
 */
export async function parseFile(
  filePath: string,
  mimeType: string
): Promise<ParsedFile> {
  const ext = path.extname(filePath)
  const fileName = path.basename(filePath)
  const category = getFileCategory(ext, mimeType)

  switch (category) {
    case 'csv':
      return parseCsv(filePath, fileName)
    case 'excel':
      return parseExcel(filePath, fileName)
    case 'pdf':
      return await parsePdf(filePath, fileName)
    case 'text':
      return parseText(filePath, fileName)
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}
