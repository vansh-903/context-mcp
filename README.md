# MCP Context Bridge 🌉

**Cross-LLM context management system with intelligent summarization**

Share conversations seamlessly between ChatGPT, Claude, and Google Gemini with automatic smart compression.

## ✨ Features

- 🔄 **Cross-LLM Context Sharing** - Continue conversations across different AI platforms
- 🧠 **Smart Summarization** - 99%+ compression while preserving key information
- 🚀 **Auto-Injection** - Context automatically loads when switching between LLMs
- 💾 **MCP Protocol** - Standards-compliant Model Context Protocol implementation
- 📊 **Token Management** - Intelligent token counting and compression
- 🔍 **Context Search** - Search through saved conversations (SQLite mode)

## 🎯 Quick Start

### Prerequisites

- Node.js 16+
- Chrome/Edge browser
- npm or yarn

### 1. Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start server
npm run dev
```

Server runs on `http://localhost:3000`

### 2. Extension Installation

```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Build extension
npm run build
```

**Install in Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select `extension/dist` folder
5. Extension icon appears in toolbar

## 📖 Usage

### Save Conversations

1. **On ChatGPT/Gemini/Claude:**
   - Look for "💾 Save to MCP" button (bottom-right)
   - Click to save current conversation
   - Green notification confirms save

2. **Via Extension Popup:**
   - Click extension icon in toolbar
   - Click "💾 Save Conversation" button

### Cross-LLM Context Transfer

Context **automatically injects** when switching LLMs:

```
ChatGPT (save) → Gemini (auto-loads context)
                    ↓
            Smart Summarization
            (99% compression)
```

**Example:**
1. Have conversation on ChatGPT
2. Click "Save to MCP"
3. Open Gemini → Context auto-fills in textarea!
4. Continue the same conversation on Gemini

### Smart Summarization

The system automatically:
- **Detects LLM switches** (ChatGPT → Gemini)
- **Compresses large contexts** (>4000 tokens)
- **Preserves key information:**
  - Important decisions
  - User preferences
  - Recent conversations (last 3)
  - Code snippets (last 2)
  - TODO items

**Compression Stats:**
- Typical: 40,000 tokens → 323 tokens (99.2% reduction)
- Target: 2000-3000 tokens per summary

## 🏗️ Architecture

```
┌─────────────────┐
│  ChatGPT/Gemini │
│     Claude      │
└────────┬────────┘
         │ Content Scripts
         │ (Extract & Inject)
         ↓
┌─────────────────┐
│Chrome Extension │
│ Service Worker  │
└────────┬────────┘
         │ HTTP/MCP
         ↓
┌─────────────────┐
│   MCP Server    │
│  (Node.js)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌─────┐   ┌──────┐
│JSON │   │SQLite│
│Store│   │ (FTS)│
└─────┘   └──────┘
```

### Components

1. **MCP Server** - Node.js backend managing context storage
2. **Chrome Extension** - Browser integration with content scripts
3. **Smart Summarizer** - Rule-based context compression
4. **Storage** - JSON (default) or SQLite (with full-text search)

## ⚙️ Configuration

### Server (.env)

```env
# Server Configuration
PORT=3000
STORAGE_TYPE=json

# JSON Storage (default)
JSON_STORAGE_PATH=./data/contexts.json

# SQLite Storage (optional)
SQLITE_DB_PATH=./data/mcp.db

# Session
SESSION_TIMEOUT=7200000
```

### Extension Settings

Click extension icon → Configure:
- **Server URL:** Default `http://localhost:3000`
- **Auto-inject context:** ✅ Enabled
- **Show notifications:** ✅ Enabled

## 🔧 API Reference

### MCP Tools

#### `get_smart_summary`
Get intelligently summarized context

```json
{
  "name": "get_smart_summary",
  "arguments": {
    "source_llm": "chatgpt",
    "target_llm": "gemini",
    "max_tokens": 2500
  }
}
```

**Response:**
```json
{
  "content": "...",
  "originalTokens": 40000,
  "summaryTokens": 323,
  "compressionRatio": 0.008,
  "summarized": true
}
```

#### `add_context`
Save new context

```json
{
  "name": "add_context",
  "arguments": {
    "content": "...",
    "entry_type": "summary",
    "source_llm": "chatgpt",
    "metadata": {}
  }
}
```

### REST Endpoints

- `GET /health` - Server health check
- `POST /contexts/add` - Add new context
- `GET /contexts/all` - Get all contexts
- `POST /contexts/search` - Search contexts (SQLite only)
- `GET /session/info` - Session information

## 📊 Storage Options

### JSON Storage (Default)

**Pros:**
- Zero configuration
- Works immediately
- Simple file-based storage

**Cons:**
- No search capability
- Linear scan for queries

### SQLite Storage

**Pros:**
- Full-text search (FTS5)
- Efficient queries
- Better for large datasets

**Setup:**
```env
STORAGE_TYPE=sqlite
SQLITE_DB_PATH=./data/mcp.db
```

Server auto-creates database on first run.

## 🧪 Testing

### Manual Testing

1. **Save on ChatGPT:**
   - Open ChatGPT
   - Have a conversation
   - Click "Save to MCP"
   - Check console (F12): Should see success message

2. **Load on Gemini:**
   - Open Gemini (new tab)
   - Press F12 (console)
   - Should see: `[MCP Extension] Context injected successfully!`
   - Textarea pre-filled with context

3. **Verify Compression:**
   - Check extension popup
   - View token count increase
   - Notification shows compression ratio

### Server Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "session_id": "...",
  "contexts": 36,
  "tokens": 43400,
  "storage": "json"
}
```

## 🐛 Troubleshooting

### Extension Issues

**"Extension context invalidated"**
- Solution: Reload extension → Refresh page

**"Textarea not found"**
- LLM page structure changed
- Check console for selector logs
- Update content script selectors

**"Server offline"**
- Check server is running: `npm run dev`
- Verify port 3000 is not in use
- Check extension settings (server URL)

### Server Issues

**Port already in use:**
```bash
# Change PORT in .env
PORT=3001
```

**TypeScript compilation errors:**
```bash
# Rebuild
cd server
npm run build
```

## 📝 Development

### Project Structure

```
context-mcp/
├── server/              # MCP Server
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── config.ts          # Configuration
│   │   ├── types.ts           # TypeScript types
│   │   ├── mcp/               # MCP protocol handlers
│   │   ├── services/          # Business logic (summarizer)
│   │   ├── storage/           # Storage implementations
│   │   └── routes/            # REST API routes
│   └── data/            # Storage files
│
└── extension/           # Chrome Extension
    ├── src/
    │   ├── background/        # Service worker
    │   ├── content/           # Content scripts (ChatGPT, Gemini, Claude)
    │   ├── popup/             # Extension popup UI
    │   ├── api/               # MCP client
    │   └── types/             # TypeScript types
    └── dist/            # Built extension
```

### Adding New LLM Support

1. **Create content script:**
   ```typescript
   // extension/src/content/newllm.ts
   (function() {
     const LLM_TYPE = 'newllm';
     // ... implement injectContext() and extractConversation()
   })();
   ```

2. **Update manifest.json:**
   ```json
   {
     "content_scripts": [
       {
         "matches": ["https://newllm.com/*"],
         "js": ["content-newllm.js"]
       }
     ]
   }
   ```

3. **Update webpack config:**
   ```js
   entry: {
     'content-newllm': './src/content/newllm.ts'
   }
   ```

4. **Rebuild:** `npm run build`

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📜 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- MCP Protocol specification
- Claude, ChatGPT, and Gemini teams
- Open source community

## 📧 Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

**Made with ❤️ for seamless cross-LLM conversations**
