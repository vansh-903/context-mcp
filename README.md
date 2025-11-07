# MCP Context Bridge

> Cross-LLM conversation sharing using the Model Context Protocol

Transfer conversations between ChatGPT, Claude, and Gemini with smart compression.

---

## What is This?

An **MVP implementation** that lets you save conversations from one LLM and load them into another. Built using the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) - an open standard for AI context management.

**Example:** Have a conversation with ChatGPT about implementing OAuth, save it, then continue that same conversation in Claude with full context.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│        Browser Extension (Chrome)           │
│                                             │
│  ChatGPT / Gemini / Claude Content Scripts  │
│         ↓                                   │
│    Service Worker (Message Bus)             │
│         ↓                                   │
│    MCP Client (HTTP/JSON-RPC)               │
└──────────────┬──────────────────────────────┘
               │
               │ HTTP POST: JSON-RPC 2.0
               │ http://localhost:3000/mcp/v1/rpc
               ↓
┌──────────────────────────────────────────────┐
│         MCP Server (Node.js + Express)       │
│                                              │
│  MCP Handler → Summarizer → Storage          │
│                              ↓               │
│                     JSON or SQLite           │
└──────────────────────────────────────────────┘
```

**Components:**
- **Extension**: Injects buttons into LLM pages, extracts/loads conversations
- **MCP Server**: Stores contexts and compresses them (96-99% reduction)
- **Storage**: JSON (default) or SQLite with full-text search

---

## Features

✅ **Manual Context Transfer** - Load context via UI buttons (no auto-injection)
✅ **Smart Compression** - Rule-based summarization (96-99% token reduction)
✅ **MCP Protocol** - JSON-RPC 2.0 compliant
✅ **Dual Storage** - JSON or SQLite with FTS5
✅ **Three LLMs** - ChatGPT, Gemini, Claude support

---

## Quick Start

### 1. Start the Server

```bash
# Clone and navigate to server
git clone https://github.com/vansh-903/context-mcp.git
cd context-mcp/server

# Install and run
npm install
cp .env.example .env
npm run dev
```

Server runs at: **http://localhost:3000**

### 2. Install Extension

```bash
# Build extension
cd ../extension
npm install
npm run build
```

**Install in Chrome:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist` folder

✅ Done!

---

## How to Use

### Save a Conversation

1. Go to ChatGPT/Gemini/Claude
2. Have a conversation
3. Click **"💾 Save to MCP"** button (bottom-right)
4. See success notification

### Load Context

1. Go to a different LLM (e.g., Gemini)
2. Click **"📥 Load Context"** button (bottom-right)
3. Select source LLM from dropdown (e.g., "ChatGPT")
4. Context appears in textarea
5. Continue your conversation!

---

## Configuration

### Server (.env)

```env
PORT=3000                    # Server port
HOST=localhost               # Server host
DATA_DIR=./data              # Storage location
STORAGE_TYPE=json            # 'json' or 'sqlite'
```

### Switch to SQLite

SQLite gives you full-text search capabilities:

```env
STORAGE_TYPE=sqlite
```

Server auto-creates `data/mcp.db` with FTS5 index.

---

## API

### MCP Tools (JSON-RPC 2.0)

**Add Context:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "add_context",
    "arguments": {
      "content": "ChatGPT conversation:\n\n...",
      "source_llm": "chatgpt"
    }
  }
}
```

**Get Summary:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_smart_summary",
    "arguments": {
      "source_llm": "chatgpt",
      "target_llm": "gemini",
      "max_tokens": 2500
    }
  }
}
```

**Search (SQLite only):**
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_context",
    "arguments": {
      "query": "OAuth implementation",
      "limit": 10
    }
  }
}
```

### REST Endpoints

- `GET /health` - Health check
- `GET /` - Server info

---

## Extending

This is an MVP. Here's how to add common features:

### Add PostgreSQL Storage

```typescript
// server/src/storage/postgres-storage.ts
import { Pool } from 'pg';

export class PostgresStorage implements IStorage {
  private pool = new Pool({ connectionString: process.env.DATABASE_URL });

  async addContext(data) {
    const result = await this.pool.query(
      'INSERT INTO contexts (...) VALUES (...) RETURNING *',
      [...]
    );
    return result.rows[0];
  }
}
```

**.env:**
```env
STORAGE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@localhost:5432/mcp
```

### Add AI Summarization

```typescript
// server/src/services/ai-summarizer.ts
import OpenAI from 'openai';

export class AISummarizer {
  async summarize(context: string, maxTokens: number) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'Summarize preserving key info' },
        { role: 'user', content: context }
      ],
      max_tokens: maxTokens
    });
    return response.choices[0].message.content;
  }
}
```

**.env:**
```env
SUMMARIZER_TYPE=ai
OPENAI_API_KEY=sk-...
```

### Add Cloud Sync (Supabase)

```typescript
// server/src/storage/supabase-storage.ts
import { createClient } from '@supabase/supabase-js';

export class SupabaseStorage implements IStorage {
  private supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  async addContext(data) {
    const { data: entry, error } = await this.supabase
      .from('contexts')
      .insert([data])
      .select()
      .single();
    return entry;
  }
}
```

**.env:**
```env
STORAGE_TYPE=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJh...
```

The `IStorage` interface makes any database easy to add. See [IMPLEMENTATION.md](IMPLEMENTATION.md) for details.

---

## Troubleshooting

**Extension not working after reload:**
- Close all LLM tabs
- Reload extension at `chrome://extensions/`
- Open fresh tabs

**"Textarea not found":**
- LLM updated their page structure
- Check console (F12) for selector errors
- Update selectors in `extension/src/content/{llm}.ts`

**Server won't start (port in use):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

**Context corrupted:**
```bash
cp data/contexts.json data/contexts.json.backup
echo "[]" > data/contexts.json
```

---

## Project Structure

```
context-mcp/
├── extension/              # Chrome Extension
│   ├── src/
│   │   ├── content/       # Content scripts (ChatGPT, Gemini, Claude)
│   │   ├── background/    # Service worker
│   │   ├── api/           # MCP client
│   │   └── popup/         # Extension UI
│   └── dist/              # Built extension
│
└── server/                # MCP Server
    ├── src/
    │   ├── mcp/          # Protocol handlers
    │   ├── services/     # Summarizer
    │   └── storage/      # JSON/SQLite implementations
    └── data/             # Storage files
```

---

## Contributing

Contributions welcome!

1. Fork the repo
2. Create feature branch: `git checkout -b feature/name`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/name`
5. Open Pull Request

**Ideas:**
- Add Perplexity/Poe support
- Implement conversation threading
- Add semantic search (vector embeddings)
- Build mobile extension
- Add export/import features

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Links

- **GitHub:** https://github.com/vansh-903/context-mcp
- **MCP Spec:** https://modelcontextprotocol.io
- **Implementation Details:** [IMPLEMENTATION.md](IMPLEMENTATION.md)

---

**Built with ❤️ by [Vansh Arora](https://github.com/vansh-903)**

*Star ⭐ if you find this useful!*
