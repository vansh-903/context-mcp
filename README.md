# MCP Context Bridge 🌉

> **An MVP (Minimum Viable Product) for cross-LLM conversation sharing with intelligent context management**

Transfer conversations seamlessly between ChatGPT, Claude, and Google Gemini using the Model Context Protocol (MCP) with smart rule-based compression.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Usage Guide](#-usage-guide)
- [Configuration](#%EF%B8%8F-configuration)
- [Extending the MVP](#-extending-the-mvp)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🎯 Overview

**MCP Context Bridge** is an MVP implementation that enables seamless conversation transfer between different Large Language Model interfaces (ChatGPT, Claude, Gemini). Built on the Model Context Protocol (MCP), it provides a foundation for intelligent cross-LLM context management.

### What is this MVP?

This is a **Minimum Viable Product** demonstrating:
- ✅ Cross-platform conversation transfer
- ✅ Manual context loading (no automatic injection)
- ✅ Rule-based smart compression (96-99% reduction)
- ✅ MCP protocol compliance (JSON-RPC 2.0)
- ✅ Extensible architecture for future enhancements

### Why MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard for managing context between AI applications. This implementation:
- Uses JSON-RPC 2.0 for client-server communication
- Implements MCP tools (`add_context`, `get_smart_summary`)
- Provides foundation for advanced context strategies
- Enables future AI-powered summarization

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Extension (Manifest V3)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   ChatGPT    │  │    Gemini    │  │    Claude    │          │
│  │Content Script│  │Content Script│  │Content Script│          │
│  │              │  │              │  │              │          │
│  │ • Extract    │  │ • Extract    │  │ • Extract    │          │
│  │ • Inject     │  │ • Inject     │  │ • Inject     │          │
│  │ • UI Buttons │  │ • UI Buttons │  │ • UI Buttons │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                   ┌────────▼────────┐                           │
│                   │ Service Worker  │                           │
│                   │  (Background)   │                           │
│                   │                 │                           │
│                   │ • State Mgmt    │                           │
│                   │ • Message Bus   │                           │
│                   └────────┬────────┘                           │
│                            │                                     │
│                   ┌────────▼────────┐                           │
│                   │   MCP Client    │                           │
│                   │  (HTTP Client)  │                           │
│                   │                 │                           │
│                   │ • JSON-RPC 2.0  │                           │
│                   │ • HTTP Requests │                           │
│                   └────────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ HTTP POST (JSON-RPC 2.0)
                             │ http://localhost:3000/mcp/v1/rpc
                             │
                ┌────────────▼───────────┐
                │   MCP Server (Node.js) │
                │  ┌──────────────────┐  │
                │  │  Express Server  │  │
                │  │  Port: 3000      │  │
                │  └────────┬─────────┘  │
                │           │             │
                │  ┌────────▼─────────┐  │
                │  │   MCP Handler    │  │
                │  │  (JSON-RPC 2.0)  │  │
                │  │                  │  │
                │  │ • Request Router │  │
                │  │ • Tool Executor  │  │
                │  └────────┬─────────┘  │
                │           │             │
                │  ┌────────▼─────────┐  │
                │  │   Summarizer     │  │
                │  │ (Rule-based AI)  │  │
                │  │                  │  │
                │  │ • Extract Keys   │  │
                │  │ • Deduplicate    │  │
                │  │ • Compress       │  │
                │  └────────┬─────────┘  │
                │           │             │
                │  ┌────────▼─────────┐  │
                │  │  Storage Layer   │  │
                │  │                  │  │
                │  │ • JSON (Default) │  │
                │  │ • SQLite + FTS5  │  │
                │  │ • Extensible     │  │
                │  └──────────────────┘  │
                └────────────────────────┘
```

### Component Breakdown

#### 1. **Browser Extension** (Chrome Manifest V3)
- **Content Scripts**: Inject into ChatGPT/Gemini/Claude pages
  - DOM manipulation (extract conversations)
  - Textarea injection (load context)
  - UI buttons (💾 Save, 📥 Load Context)
- **Service Worker**: Background process managing state
  - Message routing between content scripts and MCP client
  - Settings management
  - LLM tracking (last used, current)
- **MCP Client**: HTTP client for JSON-RPC 2.0 communication
  - Tool calls (`add_context`, `get_smart_summary`)
  - Error handling

#### 2. **MCP Server** (Node.js + Express)
- **Express Server**: HTTP server on port 3000
  - `/mcp/v1/rpc` - JSON-RPC endpoint
  - `/health` - Health check
- **MCP Handler**: Request processor
  - JSON-RPC 2.0 compliance
  - Tool routing (`add_context`, `get_smart_summary`, etc.)
  - Resource management
- **Summarizer**: Rule-based compression
  - Extract key information (decisions, preferences, code)
  - Deduplicate repeated content
  - Compress to token limit (96-99% reduction)
- **Storage**: Pluggable backend
  - **JSON**: Simple file-based (default)
  - **SQLite**: Database with FTS5 full-text search

#### 3. **Data Flow**

**Save Conversation:**
```
ChatGPT Page → Extract DOM → Content Script → Service Worker
→ MCP Client → HTTP POST → MCP Server → Storage
```

**Load Context:**
```
User clicks "Load Context" → Select source LLM (ChatGPT)
→ Service Worker → MCP Client → Request summary
→ Server: Fetch + Summarize → Return compressed context
→ Inject into Gemini textarea
```

---

## ✨ Features

### Core Capabilities

- 🔄 **Cross-LLM Context Sharing** - Manual transfer between ChatGPT, Gemini, and Claude
- 🧠 **Smart Compression** - Rule-based summarization with 96-99% token reduction
- 💾 **MCP Protocol** - Standards-compliant JSON-RPC 2.0 implementation
- 📊 **Dual Storage** - JSON (default) or SQLite with FTS5 search
- 🎛️ **Manual Control** - User-triggered context loading via UI buttons
- 🔍 **Token Management** - Accurate token counting (~4 chars per token)

### MVP Limitations (By Design)

- ❌ No automatic context injection (manual button-based)
- ❌ No AI-powered summarization (rule-based only)
- ❌ No cloud sync (local server only)
- ❌ No multi-user support (single session)
- ❌ No conversation threading (flat storage)

These are **intentional** for the MVP. See [Extending the MVP](#-extending-the-mvp) for enhancement paths.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **Chrome** or **Edge** browser
- **npm** (comes with Node.js)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/vansh-903/context-mcp.git
cd context-mcp
```

#### 2. Set Up MCP Server

```bash
cd server

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# Start server in development mode
npm run dev
```

Server starts at: **http://localhost:3000**

You should see:
```
[INFO] 🚀 MCP Server running at http://localhost:3000
[INFO] Storage: json
```

#### 3. Build & Install Extension

```bash
cd ../extension

# Install dependencies
npm install

# Build extension
npm run build
```

**Install in Chrome:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Navigate to `context-mcp/extension/dist` folder
5. Select the folder and click **"Select Folder"**
6. Extension appears in toolbar (you may need to pin it)

✅ **Installation Complete!**

---

## 🔍 How It Works

### The Context Transfer Process

```
┌─────────────────────────────────────────────────────────────┐
│                    Step 1: Save Conversation                 │
└─────────────────────────────────────────────────────────────┘

   ChatGPT Page
        │
        │ User clicks "💾 Save to MCP"
        ↓
   Content Script extracts DOM:
   ┌──────────────────────────────────┐
   │ [User]: How do I implement X?   │
   │ [Assistant]: You can do...      │
   │ [User]: What about Y?            │
   │ [Assistant]: For Y, try...       │
   └──────────────────────────────────┘
        │
        │ chrome.runtime.sendMessage({action: 'addContext'})
        ↓
   Service Worker
        │
        │ Forward to MCP Client
        ↓
   HTTP POST to /mcp/v1/rpc
   {
     "jsonrpc": "2.0",
     "method": "tools/call",
     "params": {
       "name": "add_context",
       "arguments": {
         "content": "ChatGPT conversation:\n\n...",
         "source_llm": "chatgpt",
         "entry_type": "summary"
       }
     }
   }
        │
        ↓
   MCP Server receives, counts tokens, stores:
   {
     "id": "uuid-123",
     "content": "...",
     "source_llm": "chatgpt",
     "token_count": 1250,
     "created_at": "2025-11-07T..."
   }
        │
        ↓
   ✅ Saved to data/contexts.json (or SQLite)

┌─────────────────────────────────────────────────────────────┐
│                    Step 2: Load Context                      │
└─────────────────────────────────────────────────────────────┘

   Gemini Page
        │
        │ User clicks "📥 Load Context"
        │ Selects "ChatGPT" from dropdown
        ↓
   Content Script requests context:
   chrome.runtime.sendMessage({
     action: 'getSmartContext',
     data: {
       targetLLM: 'gemini',
       sourceLLM: 'chatgpt',
       maxTokens: 2500
     }
   })
        │
        ↓
   Service Worker → MCP Client
        │
        ↓
   HTTP POST to /mcp/v1/rpc
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
        │
        ↓
   MCP Server:
   1. Fetch all contexts where source_llm='chatgpt'
   2. Calculate total tokens (e.g., 1250 tokens)
   3. Check if > maxTokens (2500)
      → No compression needed
   4. Return full context
        │
        ↓
   Response:
   {
     "content": "ChatGPT conversation:\n\n...",
     "originalTokens": 1250,
     "summaryTokens": 1250,
     "compressionRatio": 1.0,
     "summarized": false
   }
        │
        ↓
   Content Script injects into Gemini textarea:
   ┌──────────────────────────────────────────┐
   │ [Context from chatgpt]                   │
   │ ChatGPT conversation:                    │
   │                                          │
   │ [User]: How do I implement X?            │
   │ [Assistant]: You can do...               │
   │ [User]: What about Y?                    │
   │ [Assistant]: For Y, try...               │
   │                                          │
   │ [Continue conversation]                  │
   │ █                                        │
   └──────────────────────────────────────────┘
        │
        ↓
   User continues conversation in Gemini
   with full context from ChatGPT!
```

### Smart Compression (When Triggered)

When context exceeds `maxTokens` (default 2500):

```typescript
// Rule-based compression algorithm
1. Extract Key Information:
   - Last 3 conversations (most recent context)
   - Last 2 code blocks (technical details)
   - All decisions marked with keywords
   - All TODO items
   - User preferences

2. Deduplicate:
   - Remove repeated information
   - Consolidate similar topics

3. Compress:
   - Remove verbose formatting
   - Truncate to fit maxTokens

Result: 40,000 tokens → 2,450 tokens (93.9% reduction)
```

---

## 📖 Usage Guide

### 1. Save Conversations

#### **Method A: Content Script Button (Recommended)**

1. Open ChatGPT, Gemini, or Claude
2. Have a conversation
3. Look for **"💾 Save to MCP"** button (bottom-right of page)
4. Click to save
5. Green notification: **"Conversation saved successfully"**

#### **Method B: Extension Popup**

1. Click extension icon in Chrome toolbar
2. Click **"💾 Save Conversation"** button
3. Current tab's conversation is saved

### 2. Load Context (Manual Transfer)

1. Open the target LLM page (e.g., Gemini)
2. Look for **"📥 Load Context"** button (bottom-right)
3. Click it to open dropdown menu:
   ```
   ┌─────────────────────┐
   │ 🤖 Load from Claude │
   │ 💬 Load from ChatGPT│
   │ 🌐 Load from All LLMs│
   └─────────────────────┘
   ```
4. Select source LLM (e.g., "ChatGPT")
5. Context appears in textarea with header:
   ```
   [Context from chatgpt]
   {compressed conversation}

   [Continue conversation]
   ```
6. Continue your conversation with full context!

### 3. Understanding Notifications

**Success Messages:**
- ✅ `"Conversation saved successfully"` - Context stored
- ✅ `"Context loaded from chatgpt"` - Full context (no compression)
- ✅ `"Context from chatgpt: 25000 → 2450 tokens (90% compressed)"` - Compressed

**Warning Messages:**
- ⚠️ `"No context available from chatgpt"` - No saved conversations from that LLM
- ⚠️ `"Conversation too short to save"` - Less than 50 characters

**Error Messages:**
- ❌ `"Could not find textarea to inject context"` - Page structure changed
- ❌ `"Failed to load context"` - Server offline or network issue

### 4. Example Workflow

**Scenario: Transfer technical discussion from ChatGPT to Claude**

```bash
# Step 1: On ChatGPT
1. Ask ChatGPT: "How do I implement OAuth 2.0 in Node.js?"
2. Get detailed response with code examples
3. Click "💾 Save to MCP"
4. See: "Conversation saved successfully"

# Step 2: On Claude
5. Open Claude.ai in new tab
6. Click "📥 Load Context"
7. Select "ChatGPT"
8. Textarea auto-fills with:
   [Context from chatgpt]
   User: How do I implement OAuth 2.0 in Node.js?
   Assistant: [full response with code]

   [Continue conversation]

9. Ask Claude: "Can you refactor this OAuth code for Express.js?"
10. Claude has full context from ChatGPT and can build on it!
```

---

## ⚙️ Configuration

### Server Configuration

Edit `server/.env`:

```env
# Server Settings
PORT=3000                    # HTTP server port
HOST=localhost               # Server hostname
DATA_DIR=./data              # Storage directory

# Storage Backend (choose one)
STORAGE_TYPE=json            # Options: 'json' | 'sqlite'

# JSON Storage (default)
# No additional config needed - uses DATA_DIR/contexts.json

# SQLite Storage (optional)
# Automatically creates DATA_DIR/mcp.db with FTS5 index

# Logging
LOG_LEVEL=info               # Options: 'error' | 'warn' | 'info' | 'debug'
```

**Apply changes:**
```bash
cd server
npm run dev  # Restart server
```

### Extension Configuration

Currently, the extension uses hardcoded settings:
- **Server URL:** `http://localhost:3000`
- **Max Tokens:** `2500`
- **Manual Loading:** Enabled (no auto-injection)

To modify:
1. Edit `extension/src/background/service-worker.ts`
2. Rebuild: `npm run build`
3. Reload extension in Chrome

---

## 🔧 Extending the MVP

This is an MVP with intentional limitations. Here's how to extend it:

### 1. Add AI-Powered Summarization

**Current:** Rule-based extraction (96-99% compression)

**Enhancement:** Integrate OpenAI/Anthropic for intelligent summarization

```typescript
// server/src/services/ai-summarizer.ts
import OpenAI from 'openai';

export class AISummarizer {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async summarize(context: string, maxTokens: number): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'Summarize this conversation preserving key decisions, code, and context.'
        },
        { role: 'user', content: context }
      ],
      max_tokens: maxTokens
    });

    return response.choices[0].message.content || '';
  }
}
```

**Configuration:**
```env
# .env
SUMMARIZER_TYPE=ai           # 'rule-based' | 'ai'
OPENAI_API_KEY=sk-...
```

### 2. Add Database Support (PostgreSQL, MongoDB)

**Current:** JSON or SQLite

**Enhancement:** Implement storage interface for other databases

```typescript
// server/src/storage/postgres-storage.ts
import { Pool } from 'pg';
import { IStorage, ContextEntry } from './storage-interface';

export class PostgresStorage implements IStorage {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.initDatabase();
  }

  private async initDatabase() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS contexts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        content TEXT NOT NULL,
        entry_type VARCHAR(50) DEFAULT 'summary',
        source_llm VARCHAR(50),
        token_count INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );

      CREATE INDEX idx_source_llm ON contexts(source_llm);
      CREATE INDEX idx_created_at ON contexts(created_at DESC);

      -- Full-text search using tsvector
      CREATE INDEX idx_content_fts ON contexts USING GIN(to_tsvector('english', content));
    `);
  }

  async addContext(data: Omit<ContextEntry, 'id' | 'created_at'>): Promise<ContextEntry> {
    const result = await this.pool.query(
      `INSERT INTO contexts (session_id, content, entry_type, source_llm, token_count, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.session_id, data.content, data.entry_type, data.source_llm, data.token_count, data.metadata]
    );
    return result.rows[0];
  }

  async searchContexts(query: string, limit: number): Promise<ContextEntry[]> {
    const result = await this.pool.query(
      `SELECT * FROM contexts
       WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
       ORDER BY created_at DESC
       LIMIT $2`,
      [query, limit]
    );
    return result.rows;
  }

  // ... implement other IStorage methods
}
```

**Configuration:**
```env
# .env
STORAGE_TYPE=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_context
```

### 3. Add Cloud Sync (Firebase, Supabase)

**Current:** Local server only

**Enhancement:** Add real-time sync across devices

```typescript
// server/src/storage/supabase-storage.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorage, ContextEntry } from './storage-interface';

export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async addContext(data: Omit<ContextEntry, 'id' | 'created_at'>): Promise<ContextEntry> {
    const { data: entry, error } = await this.supabase
      .from('contexts')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return entry;
  }

  async getAllContexts(): Promise<ContextEntry[]> {
    const { data, error } = await this.supabase
      .from('contexts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Real-time subscription
  subscribeToChanges(callback: (entry: ContextEntry) => void) {
    this.supabase
      .channel('contexts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contexts' },
        (payload) => callback(payload.new as ContextEntry)
      )
      .subscribe();
  }
}
```

**Database Schema (Supabase):**
```sql
-- Run in Supabase SQL Editor
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),  -- Multi-user support
  content TEXT NOT NULL,
  entry_type VARCHAR(50) DEFAULT 'summary',
  source_llm VARCHAR(50),
  token_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contexts"
  ON contexts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contexts"
  ON contexts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4. Add Conversation Threading

**Current:** Flat storage (all contexts in one list)

**Enhancement:** Organize by conversation threads

```typescript
// server/src/types/index.ts
export interface ConversationThread {
  id: string;
  title: string;
  llm_sources: string[];      // ['chatgpt', 'claude']
  context_ids: string[];      // References to ContextEntry
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface ContextEntry {
  id: string;
  thread_id?: string;         // Link to thread
  session_id: string;
  content: string;
  entry_type: 'summary' | 'note' | 'code' | 'decision';
  source_llm?: string;
  token_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}
```

**New MCP Tool:**
```typescript
// server/src/mcp/tools.ts
export const MCP_TOOLS = [
  // ... existing tools
  {
    name: 'create_thread',
    description: 'Create a new conversation thread',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        llm_sources: { type: 'array', items: { type: 'string' } }
      },
      required: ['title']
    }
  },
  {
    name: 'get_thread_summary',
    description: 'Get summarized context for a specific thread',
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: { type: 'string' },
        max_tokens: { type: 'number' }
      },
      required: ['thread_id']
    }
  }
];
```

### 5. Add Multi-User Support

**Current:** Single session

**Enhancement:** User authentication and isolation

```typescript
// server/src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// server/src/index.ts
app.use('/mcp/v1/rpc', authenticateUser);
```

**Storage Changes:**
```typescript
// Add user_id to all queries
async getAllContexts(userId: string): Promise<ContextEntry[]> {
  return this.db.query('SELECT * FROM contexts WHERE user_id = ?', [userId]);
}
```

### 6. Add Vector Search (Semantic Search)

**Current:** Keyword-based search (SQLite FTS5)

**Enhancement:** Semantic search using embeddings

```typescript
// server/src/services/vector-search.ts
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';

export class VectorSearchService {
  private vectorStore: PineconeStore;

  async initialize() {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });

    const index = pinecone.Index('mcp-contexts');

    this.vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      { pineconeIndex: index }
    );
  }

  async addContext(content: string, metadata: any) {
    await this.vectorStore.addDocuments([
      { pageContent: content, metadata }
    ]);
  }

  async semanticSearch(query: string, limit: number = 5): Promise<ContextEntry[]> {
    const results = await this.vectorStore.similaritySearch(query, limit);
    return results.map(doc => ({
      ...doc.metadata,
      content: doc.pageContent
    }));
  }
}
```

**New MCP Tool:**
```typescript
{
  name: 'semantic_search',
  description: 'Search contexts using semantic similarity',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'number', default: 5 }
    },
    required: ['query']
  }
}
```

---

## 📚 API Reference

### MCP Tools

#### `add_context`

Save new context entry.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "add_context",
    "arguments": {
      "content": "ChatGPT conversation:\n\nUser: How do I...",
      "entry_type": "summary",
      "source_llm": "chatgpt",
      "metadata": {
        "url": "https://chat.openai.com/...",
        "timestamp": 1699372800000
      }
    }
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-11-07T10:00:00.000Z",
    "token_count": 1250
  },
  "id": 1
}
```

#### `get_smart_summary`

Get intelligently compressed context.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_smart_summary",
    "arguments": {
      "source_llm": "chatgpt",
      "target_llm": "gemini",
      "max_tokens": 2500
    }
  },
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": "[Compressed conversation content...]",
    "originalTokens": 25000,
    "summaryTokens": 2450,
    "compressionRatio": 0.098,
    "summarized": true,
    "message": "Summarized: 25000 → 2450 tokens (98% of original)"
  },
  "id": 2
}
```

#### `search_context` (SQLite only)

Full-text search through saved contexts.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search_context",
    "arguments": {
      "query": "OAuth implementation",
      "limit": 10
    }
  },
  "id": 3
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "results": [
      {
        "id": "...",
        "content": "...",
        "entry_type": "summary",
        "source_llm": "chatgpt",
        "created_at": "2025-11-07T10:00:00.000Z",
        "token_count": 1250
      }
    ]
  },
  "id": 3
}
```

#### `get_session_info`

Get current session metadata.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_session_info",
    "arguments": {}
  },
  "id": 4
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "session": {
      "id": "session-uuid",
      "created_at": "2025-11-07T09:00:00.000Z"
    },
    "entry_count": 42,
    "total_tokens": 52500
  },
  "id": 4
}
```

### REST Endpoints

#### `GET /health`

Server health check.

**Response:**
```json
{
  "status": "ok",
  "storage": "json",
  "version": "1.0.0"
}
```

#### `GET /`

Server information.

**Response:**
```json
{
  "name": "MCP Context Server",
  "version": "1.0.0",
  "protocol": "mcp-v1",
  "endpoints": {
    "rpc": "/mcp/v1/rpc",
    "sse": "/mcp/v1/sse",
    "health": "/health"
  }
}
```

---

## 🐛 Troubleshooting

### Extension Issues

#### "Extension context invalidated"

**Cause:** Extension was reloaded while tabs were still open.

**Solution:**
1. Close all ChatGPT/Gemini/Claude tabs
2. Go to `chrome://extensions/`
3. Click reload button on MCP Context Bridge
4. Open fresh tabs

#### "Textarea not found"

**Cause:** LLM website updated their DOM structure.

**Solution:**
1. Press F12 to open DevTools
2. Look for console error with selector details
3. Update content script selectors in:
   - `extension/src/content/chatgpt.ts`
   - `extension/src/content/gemini.ts`
   - `extension/src/content/claude.ts`
4. Rebuild: `npm run build`
5. Reload extension

#### "Failed to load context"

**Cause:** Server is offline or unreachable.

**Solution:**
1. Check server is running:
   ```bash
   cd server
   npm run dev
   ```
2. Verify port 3000 is not in use:
   ```bash
   # Windows
   netstat -ano | findstr :3000

   # macOS/Linux
   lsof -i :3000
   ```
3. Test server:
   ```bash
   curl http://localhost:3000/health
   ```

### Server Issues

#### Port already in use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Option 1: Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Option 2: Change port in .env
PORT=3001
```

#### TypeScript compilation errors

**Solution:**
```bash
cd server
npm run build

# If errors persist, clean install
rm -rf node_modules package-lock.json
npm install
```

#### Storage file corruption

**Symptoms:** `SyntaxError: Unexpected token` when reading contexts.json

**Solution:**
```bash
# Backup corrupted file
cp data/contexts.json data/contexts.json.backup

# Reset storage
echo "[]" > data/contexts.json

# Restart server
npm run dev
```

### Common Issues

#### Context not appearing in textarea

**Debug steps:**
1. Open DevTools (F12)
2. Check Console tab for errors
3. Look for:
   ```
   [MCP Extension - Gemini] Textarea found: false
   ```
4. Try different textarea selector
5. Check if page is fully loaded (wait 2-3 seconds after page load)

#### Context is truncated

**Cause:** Summarization compressed too aggressively.

**Solution:** Increase `max_tokens`:
```typescript
// extension/src/background/service-worker.ts
const response = await mcpClient.getSmartSummary(
  targetLLM,
  sourceLLM,
  5000  // Increase from 2500 to 5000
);
```

---

## 🤝 Contributing

Contributions are welcome! This is an MVP with lots of room for enhancement.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/vansh-903/context-mcp.git
   cd context-mcp
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Add features or fix bugs
   - Update tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Server
   cd server
   npm test

   # Extension
   cd extension
   npm run build
   # Load unpacked and test manually
   ```

5. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add PostgreSQL storage backend"
   git commit -m "fix: handle empty context gracefully"
   git commit -m "docs: update README with new features"
   ```

6. **Push and create Pull Request**
   ```bash
   git push origin feature/amazing-feature
   ```

### Areas for Contribution

- 🎨 **UI/UX**: Improve extension popup, better notifications
- 🔍 **Search**: Add semantic search with vector embeddings
- 🗄️ **Storage**: Implement PostgreSQL, MongoDB, Supabase
- 🤖 **AI**: Add GPT-4/Claude-powered summarization
- 🔐 **Auth**: Multi-user support with authentication
- 📱 **Mobile**: Browser extension for mobile browsers
- 🧪 **Testing**: Unit tests, integration tests, E2E tests
- 📚 **Docs**: Tutorials, video guides, use cases

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Vansh Arora

---

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- [Claude](https://claude.ai), [ChatGPT](https://chat.openai.com), and [Gemini](https://gemini.google.com) teams
- Open source community

---

## 📧 Contact & Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/vansh-903/context-mcp/issues)
- **Discussions:** [Ask questions or share ideas](https://github.com/vansh-903/context-mcp/discussions)
- **Email:** vansharora903@gmail.com

---

## 🗺️ Roadmap

### Phase 1: MVP (Current) ✅
- [x] Basic cross-LLM context sharing
- [x] Manual context loading
- [x] Rule-based summarization
- [x] JSON/SQLite storage
- [x] Chrome extension

### Phase 2: Enhanced Intelligence (Planned)
- [ ] AI-powered summarization (GPT-4/Claude)
- [ ] Semantic search with embeddings
- [ ] Conversation threading
- [ ] Context relevance scoring

### Phase 3: Scale & Collaboration (Future)
- [ ] Cloud sync (Supabase/Firebase)
- [ ] Multi-user support
- [ ] Team workspaces
- [ ] Real-time collaboration
- [ ] API for third-party integrations

### Phase 4: Enterprise Features (Vision)
- [ ] SSO authentication
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Custom deployment options
- [ ] SLA guarantees

---

**Built with ❤️ for seamless cross-LLM conversations**

*Star ⭐ this repo if you find it useful!*
