# [10x Analyst](https://10xdotin.github.io/10x-analyst/)

> AI-powered data analysis. Upload files. Ask questions. Get insights.

**[Visit Site](https://10xdotin.github.io/10x-analyst/)** | [GitHub](https://github.com/10xDotIn/10x-analyst)

---

## What is it

Drop a CSV, Excel, or PDF file into the chat and ask anything about your data. The AI analyzes it and streams back insights in real-time — tables, trends, comparisons, summaries.

## Quick start

```bash
git clone https://github.com/10xDotIn/10x-analyst.git
cd 10x-analyst
bash setup.sh
```

**Windows:** double-click `setup.bat`
**Mac:** double-click `setup.command`

The installer checks Node.js, installs dependencies, starts both servers, and opens the app at `http://localhost:5173`.

## Features

- **Real-time streaming** — responses appear word-by-word via SSE, like Claude web
- **File upload** — CSV, Excel (.xlsx/.xls), PDF, text, markdown
- **Markdown rendering** — code blocks with copy button, tables, links, headings
- **Chat history** — SQLite-backed persistence, create/rename/delete conversations
- **Dark + light mode** — full semantic token design system
- **Embeddable widget** — deploy as a floating chat button on any website
- **Active files context** — see which files the AI is using for analysis
- **One-command setup** — installer scripts for Windows, Mac, and Linux

## Supported file types

| Type | Extensions |
|------|-----------|
| CSV | `.csv` |
| Excel | `.xlsx`, `.xls` |
| PDF | `.pdf` |
| Text | `.txt`, `.md` |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Backend | Express 5 |
| Database | SQLite (better-sqlite3) |
| AI | OpenAnalyst API (SSE streaming) |
| Icons | Lucide React |
| File parsing | csv-parse, xlsx, pdf-parse |

## Project structure

```
src/
  App.tsx              — root layout, chat state, streaming logic
  components/
    Sidebar.tsx        — persistent sidebar (desktop) / overlay (mobile)
    WelcomeView.tsx    — greeting, quick actions, file upload
    ConversationView.tsx — message list, thinking indicator, input
    MessageItem.tsx    — markdown rendering, code blocks, tables
    ChatInput.tsx      — textarea with file upload
    FileChip.tsx       — color-coded file type pills
    UserMenu.tsx       — login/logout dropdown
  services/
    ai.ts             — SSE streaming to OpenAnalyst API
    chatStore.ts      — chat CRUD via Express backend
    fileUpload.ts     — file upload service
server/
  index.ts            — Express API (chats, messages, file upload)
  db.ts               — SQLite schema and queries
  fileParser.ts       — CSV, Excel, PDF, text parsing
```

## Scripts

| Command | What it does |
|---------|-------------|
| `bash setup.sh` | Install + run everything (Mac/Linux) |
| `setup.bat` | Install + run everything (Windows) |
| `npm run dev` | Start frontend only |
| `npm run server` | Start backend only |
| `npm run build` | Production build |

## License

MIT

---

Built by [10xDotIn](https://github.com/10xDotIn)
