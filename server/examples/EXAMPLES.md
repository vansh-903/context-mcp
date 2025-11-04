# MCP Context Server - Usage Examples

This document provides practical examples of using the MCP Context Server.

## Table of Contents

1. [Basic Operations](#basic-operations)
2. [Real-World Scenarios](#real-world-scenarios)
3. [Integration Examples](#integration-examples)
4. [Advanced Usage](#advanced-usage)

---

## Basic Operations

### 1. Adding Context

#### Add a Conversation Summary

```bash
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Discussed implementing user authentication with JWT tokens. Decided on refresh token strategy with 7-day expiry.",
        "entry_type": "summary",
        "source_llm": "claude"
      }
    },
    "id": 1
  }'
```

#### Add a Decision

```bash
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Database choice: PostgreSQL over MySQL. Reasons: Better JSON support, full-text search, PostGIS for future geo features.",
        "entry_type": "decision",
        "source_llm": "chatgpt"
      }
    },
    "id": 2
  }'
```

#### Add User Preferences

```bash
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "User prefers functional React components with hooks. Avoid class components. Use TypeScript strict mode.",
        "entry_type": "preference",
        "source_llm": "claude"
      }
    },
    "id": 3
  }'
```

#### Add Code Snippet

```bash
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Custom error handling pattern:\n\nclass AppError extends Error {\n  constructor(public statusCode: number, message: string) {\n    super(message);\n  }\n}",
        "entry_type": "code",
        "source_llm": "claude",
        "metadata": {
          "language": "typescript",
          "file": "src/utils/errors.ts"
        }
      }
    },
    "id": 4
  }'
```

### 2. Searching Context

#### Simple Search

```bash
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_context",
      "arguments": {
        "query": "authentication",
        "limit": 5
      }
    },
    "id": 5
  }'
```

#### Advanced FTS5 Search

```bash
# Search for entries containing "React" AND "TypeScript"
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_context",
      "arguments": {
        "query": "React TypeScript",
        "limit": 10
      }
    },
    "id": 6
  }'
```

### 3. Reading Session Summary

```bash
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/summary"
    },
    "id": 7
  }'
```

### 4. Getting Recent Context

```bash
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/recent"
    },
    "id": 8
  }'
```

---

## Real-World Scenarios

### Scenario 1: Multi-Day Project Development

**Day 1 with Claude:**

```bash
# Add project overview
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Project: E-commerce platform. Stack: Next.js, TypeScript, Tailwind CSS, PostgreSQL. Features: Product catalog, cart, checkout, user auth.",
        "entry_type": "summary",
        "source_llm": "claude"
      }
    },
    "id": 1
  }'
```

**Day 2 with ChatGPT:**

```bash
# ChatGPT retrieves context
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/summary"
    },
    "id": 1
  }'

# ChatGPT continues work and adds new context
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Implemented product catalog with pagination. Using SWR for data fetching. Products API endpoint: /api/products",
        "entry_type": "summary",
        "source_llm": "chatgpt"
      }
    },
    "id": 2
  }'
```

### Scenario 2: Decision Tracking

```bash
# Record architectural decisions
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "ADR-001: Use Prisma ORM. Reasons: Type safety, migrations, great DX. Alternatives considered: TypeORM (too verbose), Drizzle (too new).",
        "entry_type": "decision",
        "source_llm": "claude",
        "metadata": {
          "adr_number": "001",
          "date": "2025-11-02"
        }
      }
    },
    "id": 1
  }'

# Later, search for decision
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_context",
      "arguments": {
        "query": "Prisma",
        "limit": 5
      }
    },
    "id": 2
  }'
```

### Scenario 3: Onboarding New Team Member

```bash
# Get project overview
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/summary"
    },
    "id": 1
  }'

# Search for specific topics
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_context",
      "arguments": {
        "query": "architecture decision",
        "limit": 10
      }
    },
    "id": 2
  }'
```

---

## Integration Examples

### Python Client Example

```python
import requests
import json

MCP_URL = "http://localhost:3000/mcp/v1/rpc"

def add_context(content, entry_type="summary", source_llm="claude"):
    """Add context to MCP server"""
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "add_context",
            "arguments": {
                "content": content,
                "entry_type": entry_type,
                "source_llm": source_llm
            }
        },
        "id": 1
    }

    response = requests.post(MCP_URL, json=payload)
    return response.json()

def search_context(query, limit=10):
    """Search context in MCP server"""
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "search_context",
            "arguments": {
                "query": query,
                "limit": limit
            }
        },
        "id": 2
    }

    response = requests.post(MCP_URL, json=payload)
    return response.json()

# Example usage
if __name__ == "__main__":
    # Add context
    result = add_context(
        "Implemented user authentication with JWT",
        entry_type="summary",
        source_llm="claude"
    )
    print("Added:", result)

    # Search
    results = search_context("authentication")
    print("Search results:", results)
```

### JavaScript/Node.js Client Example

```javascript
const MCP_URL = "http://localhost:3000/mcp/v1/rpc";

async function addContext(content, entryType = "summary", sourceLlm = "claude") {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "add_context",
        arguments: {
          content,
          entry_type: entryType,
          source_llm: sourceLlm
        }
      },
      id: 1
    })
  });

  return response.json();
}

async function searchContext(query, limit = 10) {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "search_context",
        arguments: { query, limit }
      },
      id: 2
    })
  });

  return response.json();
}

// Example usage
(async () => {
  // Add context
  const result = await addContext(
    "Building MCP server with TypeScript",
    "summary",
    "claude"
  );
  console.log("Added:", result);

  // Search
  const results = await searchContext("TypeScript");
  console.log("Search results:", results);
})();
```

---

## Advanced Usage

### Batch Operations

```bash
# Add multiple contexts in a workflow
for entry in "Set up project structure" "Configured ESLint and Prettier" "Implemented core API"; do
  curl -X POST http://localhost:3000/mcp/v1/rpc \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"add_context\",
        \"arguments\": {
          \"content\": \"$entry\",
          \"entry_type\": \"summary\",
          \"source_llm\": \"claude\"
        }
      },
      \"id\": 1
    }"
  sleep 0.5
done
```

### Monitoring Token Usage

```bash
# Get session info with token counts
curl -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_session_info"
    },
    "id": 1
  }' | python -c "
import sys, json
data = json.load(sys.stdin)
info = data['result']
print(f\"Session ID: {info['session_id']}\")
print(f\"Total Entries: {info['entry_count']}\")
print(f\"Total Tokens: {info['total_tokens']}\")
print(f\"Avg Tokens/Entry: {info['total_tokens'] / max(info['entry_count'], 1):.1f}\")
"
```

### Export Session Data

```bash
# Get all context entries
curl -s -X POST http://localhost:3000/mcp/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/list"
    },
    "id": 1
  }' | python -m json.tool > session_export.json

echo "Session exported to session_export.json"
```

---

## Tips & Best Practices

1. **Use Meaningful Content**: Write clear, concise summaries that will be useful later
2. **Categorize Properly**: Use appropriate `entry_type` (summary, decision, code, etc.)
3. **Track Source**: Always specify `source_llm` to track which LLM created the context
4. **Search Regularly**: Use FTS5 search to find relevant context before starting new conversations
5. **Monitor Tokens**: Keep an eye on token counts to avoid context window overflow
6. **Backup Regularly**: The SQLite database is in `./data/context.db` - back it up!

---

## Troubleshooting

### Search Not Finding Results

- Make sure you're using SQLite backend (FTS5 is only available in SQLite)
- Try simpler search queries
- Check that content was actually added using `/health` endpoint

### Token Counts Seem Off

- Token counting uses rough estimation (1 token ≈ 4 characters)
- For precise counts, consider integrating `tiktoken` library

### Server Not Responding

- Check if server is running: `curl http://localhost:3000/health`
- Verify port 3000 is not blocked
- Check server logs for errors

---

**For more information, see the [main README](../README.md)**
