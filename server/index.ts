import express from 'express'
import cors from 'cors'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import {
  insertChat,
  insertMessage,
  updateChatTitle,
  updateChatTimestamp,
  getAllChats,
  getChatMessages,
  deleteChat,
  deleteChatMessages,
  insertFile,
  getFilesByChatId,
  deleteFilesByChatId,
} from './db.js'
import { parseFile } from './fileParser.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// --- File upload configuration ---
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

const ALLOWED_EXTENSIONS = new Set(['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.md'])

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${timestamp}-${safeName}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`File type not allowed: ${ext}. Accepted types: .csv, .xlsx, .xls, .pdf, .txt, .md`))
    }
  },
})

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR))

// GET /api/chats — list all chats (ordered by most recent)
app.get('/api/chats', (_req, res) => {
  try {
    const chats = getAllChats.all()
    res.json(chats)
  } catch (err) {
    console.error('Failed to get chats:', err)
    res.status(500).json({ error: 'Failed to fetch chats' })
  }
})

// POST /api/chats — create a new chat
app.post('/api/chats', (req, res) => {
  try {
    const { id, title } = req.body
    if (!id || !title) {
      return res.status(400).json({ error: 'id and title are required' })
    }
    insertChat.run(id, title)
    res.status(201).json({ id, title })
  } catch (err) {
    console.error('Failed to create chat:', err)
    res.status(500).json({ error: 'Failed to create chat' })
  }
})

// PATCH /api/chats/:id — update chat title
app.patch('/api/chats/:id', (req, res) => {
  try {
    const { title } = req.body
    if (!title) {
      return res.status(400).json({ error: 'title is required' })
    }
    updateChatTitle.run(title, req.params.id)
    res.json({ id: req.params.id, title })
  } catch (err) {
    console.error('Failed to update chat:', err)
    res.status(500).json({ error: 'Failed to update chat' })
  }
})

// DELETE /api/chats/:id — delete a chat, its messages, and its uploaded files
app.delete('/api/chats/:id', (req, res) => {
  try {
    deleteChatMessages.run(req.params.id)
    deleteFilesByChatId.run(req.params.id)
    deleteChat.run(req.params.id)
    res.json({ deleted: true })
  } catch (err) {
    console.error('Failed to delete chat:', err)
    res.status(500).json({ error: 'Failed to delete chat' })
  }
})

// GET /api/chats/:id/messages — get all messages for a chat
app.get('/api/chats/:id/messages', (req, res) => {
  try {
    const messages = getChatMessages.all(req.params.id)
    res.json(messages)
  } catch (err) {
    console.error('Failed to get messages:', err)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// POST /api/chats/:id/messages — add a message to a chat
app.post('/api/chats/:id/messages', (req, res) => {
  try {
    const { id: msgId, role, content, timestamp } = req.body
    if (!msgId || !role || !content) {
      return res.status(400).json({ error: 'id, role, and content are required' })
    }
    insertMessage.run(msgId, req.params.id, role, content, timestamp || new Date().toISOString())
    updateChatTimestamp.run(req.params.id)
    res.status(201).json({ id: msgId, role, content })
  } catch (err) {
    console.error('Failed to add message:', err)
    res.status(500).json({ error: 'Failed to add message' })
  }
})

// POST /api/upload — upload and parse a file
const uploadSingle = upload.single('file')
app.post('/api/upload', function (req: any, res: any, next: any) {
  uploadSingle(req, res, function (err: any) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size is 10 MB.' })
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' })
    }

    parseFile(req.file.path, req.file.mimetype)
      .then((parsed) => {
        const fileId = crypto.randomUUID()
        const chatId = req.body?.chatId || null

        if (chatId) {
          insertFile.run(fileId, chatId, parsed.fileName, parsed.fileType, parsed.summary, parsed.data)
        }

        res.status(201).json({
          fileId,
          fileName: req.file.originalname,
          fileType: parsed.fileType,
          summary: parsed.summary,
          data: parsed.data,
          rowCount: parsed.rowCount ?? null,
          columnNames: parsed.columnNames ?? null,
        })
      })
      .catch((parseErr: any) => {
        console.error('[POST /api/upload] Parse error:', parseErr)
        res.status(422).json({ error: 'Unable to parse the file.' })
      })
  })
})

// GET /api/chats/:id/files — get all uploaded files for a chat
app.get('/api/chats/:id/files', (req, res) => {
  try {
    const files = getFilesByChatId.all(req.params.id)
    res.json(files)
  } catch (err) {
    console.error('Failed to get files:', err)
    res.status(500).json({ error: 'Unable to load files.' })
  }
})

app.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`)
})
