# MCP Context Server

A **Model Context Protocol (MCP)** server that provides persistent, shared memory for Large Language Models (LLMs). This enables seamless context sharing across different AI models and conversation sessions.

## 🌟 Features

- **✅ Full MCP Protocol Implementation** - JSON-RPC 2.0 with 4 tools and 4 resources
- **🔍 FTS5 Full-Text Search** - SQLite with advanced full-text search capabilities
- **💾 Dual Storage Backend** - Switch between JSON files (dev) and SQLite (production)
- **🔌 HTTP/SSE Transport** - Network-accessible with Server-Sent Events support
- **🏷️ Multi-LLM Support** - Track context from Claude, ChatGPT, and Gemini
- **📊 Token Counting** - Automatic token estimation for all stored context
- **🚀 Production-Ready** - Proper error handling, logging, and health checks

## 📦 Installation

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
# Clone the repository
cd server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env to customize settings

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

## 🔧 Configuration

Edit `.env` file:

```bash
# Server Configuration
PORT=3000
HOST=localhost

# Storage
DATA_DIR=./data
STORAGE_TYPE=sqlite  # 'json' or 'sqlite'

# Logging
LOG_LEVEL=info
```

## 🚀 Quick Start

### Start the Server

```bash
npm run dev
```

Server will be available at:
- **Main Server**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **MCP RPC**: http://localhost:3000/mcp/v1/rpc
- **MCP SSE**: http://localhost:3000/mcp/v1/sse

### Test with curl

```bash
# Add context
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Building a todo app with React and TypeScript",
        "entry_type": "summary",
        "source_llm": "claude"
      }
    },
    "id": 1
  }'

# Search context (FTS5)
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_context",
      "arguments": {
        "query": "React",
        "limit": 10
      }
    },
    "id": 2
  }'

# Get session summary
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/summary"
    },
    "id": 3
  }'
```

## 📚 API Reference

### MCP Tools

#### 1. `add_context`

Add a new context entry (conversation summary, note, decision, etc.)

**Parameters:**
- `content` (string, required) - The context content to store
- `entry_type` (string, optional) - Type of entry: `summary`, `note`, `preference`, `code`, `decision`
- `source_llm` (string, optional) - Source LLM: `claude`, `chatgpt`, `gemini`
- `metadata` (object, optional) - Additional metadata

**Example:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "add_context",
    "arguments": {
      "content": "User prefers TypeScript strict mode",
      "entry_type": "preference",
      "source_llm": "claude"
    }
  },
  "id": 1
}
```

#### 2. `update_context`

Update an existing context entry

**Parameters:**
- `id` (string, required) - Context entry ID
- `content` (string, required) - New content

#### 3. `search_context`

Search through stored context entries using FTS5 full-text search

**Parameters:**
- `query` (string, required) - Search query
- `limit` (number, optional) - Max results (default: 10)

#### 4. `get_session_info`

Get information about the current session

**Returns:**
- `session_id` - Session ID
- `created_at` - Creation timestamp
- `last_accessed` - Last access timestamp
- `entry_count` - Number of context entries
- `total_tokens` - Total token count

### MCP Resources

#### 1. `context://session/list`

Get a list of all context entries in the current session

#### 2. `context://session/entry/{id}`

Get a specific context entry by ID

#### 3. `context://session/summary`

Get a formatted summary of all context in the current session

#### 4. `context://session/recent`

Get recent context entries (default: last 10)

## 🗄️ Storage

### SQLite (Recommended for Production)

- **FTS5 Full-Text Search** - Advanced search capabilities
- **Better Performance** - Handles large datasets efficiently
- **Transactions** - Data integrity guarantees
- **Indexing** - Fast queries on large datasets

Database file: `./data/context.db`

### JSON Files (Good for Development)

- **Simple** - Easy to inspect and debug
- **Zero Configuration** - No database setup needed
- **Portable** - Easy to backup and migrate

Files:
- `./data/session.json` - Session metadata
- `./data/contexts.json` - Context entries

### Migration

Migrate existing JSON data to SQLite:

```bash
npm run migrate
```

Backup files will be created in `./data/json-backup/`

## 🏗️ Project Structure

```
server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── mcp/
│   │   ├── handler.ts        # MCP request handler
│   │   ├── tools.ts          # MCP tools definitions
│   │   ├── resources.ts      # MCP resources
│   │   └── types.ts          # MCP type definitions
│   ├── storage/
│   │   ├── storage-interface.ts  # Storage interface
│   │   ├── json-storage.ts       # JSON file storage
│   │   ├── sqlite-storage.ts     # SQLite storage
│   │   └── migrate.ts            # Migration script
│   ├── utils/
│   │   ├── token-counter.ts  # Token counting utility
│   │   └── logger.ts         # Logging utility
│   └── types/
│       └── index.ts          # Shared types
├── data/                     # Data directory
├── examples/                 # Example scripts
├── package.json
└── tsconfig.json
```

## 🧪 Testing

Run the test suite:

```bash
# Make script executable
chmod +x examples/test-mcp-endpoints.sh

# Run tests
./examples/test-mcp-endpoints.sh
```

## 📊 Token Counting

The server automatically counts tokens for all stored context using a simple estimation:

**1 token ≈ 4 characters**

This provides a rough estimate. For more accurate counting, you can integrate the `tiktoken` library.

## 🔒 Security

- **localhost-only by default** - Server binds to localhost
- **CORS enabled** - For browser extension access
- **Input validation** - All parameters are validated
- **SQL injection protection** - Parameterized queries

## 🚀 Next Steps

### Phase 2: Browser Extension (Planned)

- Chrome extension for Claude.ai, ChatGPT, Gemini
- Auto-inject context into conversations
- Manual save/load controls
- IndexedDB caching

### Phase 3: Intelligent Summarization (Planned)

- Conditional summarization when switching LLMs
- Token optimization (compress 8000 → 2500 tokens)
- Rule-based extraction of decisions, code, TODOs
- Cross-LLM context transfer optimization

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! This is part of the MCP Context Server project to enable shared memory across multiple LLMs.

## 🐛 Troubleshooting

### Server won't start

- Check if port 3000 is available
- Verify Node.js version (20+)
- Check logs in console

### SQLite errors

- Ensure `better-sqlite3` is installed correctly
- Try deleting `data/context.db` and restarting

### Migration issues

- Backup your JSON files first
- Check file permissions in `data/` directory
- Review migration logs

## 📖 Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Project Discussion Summary](../PROJECT_DISCUSSION_SUMMARY.md)
- [Technical Research](../mcp-technical-research.md)

---

**Built with ❤️ using TypeScript, Express, and SQLite**
