import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'chatbot.db')

const db = new Database(DB_PATH)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);

  CREATE TABLE IF NOT EXISTS uploaded_files (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    data TEXT NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_uploaded_files_chat_id ON uploaded_files(chat_id);
`)

// Prepared statements
const insertChat = db.prepare(
  `INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`
)

const insertMessage = db.prepare(
  'INSERT INTO messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)'
)

const updateChatTitle = db.prepare(
  `UPDATE chats SET title = ?, updated_at = datetime('now') WHERE id = ?`
)

const updateChatTimestamp = db.prepare(
  `UPDATE chats SET updated_at = datetime('now') WHERE id = ?`
)

const getAllChats = db.prepare(
  'SELECT id, title, created_at, updated_at FROM chats ORDER BY updated_at DESC'
)

const getChatMessages = db.prepare(
  'SELECT id, chat_id, role, content, timestamp FROM messages WHERE chat_id = ? ORDER BY timestamp ASC'
)

const deleteChat = db.prepare('DELETE FROM chats WHERE id = ?')

const deleteChatMessages = db.prepare('DELETE FROM messages WHERE chat_id = ?')

// Uploaded files prepared statements
const insertFile = db.prepare(
  `INSERT INTO uploaded_files (id, chat_id, file_name, file_type, summary, data, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
)

const getFilesByChatId = db.prepare(
  'SELECT id, chat_id, file_name, file_type, summary, data, uploaded_at FROM uploaded_files WHERE chat_id = ? ORDER BY uploaded_at ASC'
)

const deleteFilesByChatId = db.prepare('DELETE FROM uploaded_files WHERE chat_id = ?')

export {
  db,
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
}
