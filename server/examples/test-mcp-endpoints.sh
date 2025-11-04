#!/bin/bash
# MCP Context Server - Test Script
# Tests all MCP endpoints with example requests

SERVER_URL="http://localhost:3000"

echo "========================================="
echo "MCP Context Server - API Test Suite"
echo "========================================="
echo ""

# Test 1: Health Check
echo "📊 Test 1: Health Check"
curl -s "$SERVER_URL/health" | python -m json.tool
echo ""
echo ""

# Test 2: Initialize
echo "🔧 Test 2: Initialize"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}' | python -m json.tool
echo ""
echo ""

# Test 3: List Tools
echo "🛠️  Test 3: List Tools"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}' | python -m json.tool
echo ""
echo ""

# Test 4: Add Context (Summary)
echo "➕ Test 4: Add Context (Summary)"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Building an MCP server with TypeScript, Express, and SQLite. Implementing full-text search with FTS5.",
        "entry_type": "summary",
        "source_llm": "claude"
      }
    },
    "id": 3
  }' | python -m json.tool
echo ""
echo ""

# Test 5: Add Context (Decision)
echo "✅ Test 5: Add Context (Decision)"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Decided to use SQLite with FTS5 for better search performance. Migration from JSON completed successfully.",
        "entry_type": "decision",
        "source_llm": "claude"
      }
    },
    "id": 4
  }' | python -m json.tool
echo ""
echo ""

# Test 6: Search Context
echo "🔍 Test 6: Search Context (FTS5)"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_context",
      "arguments": {
        "query": "SQLite",
        "limit": 10
      }
    },
    "id": 5
  }' | python -m json.tool
echo ""
echo ""

# Test 7: Get Session Info
echo "ℹ️  Test 7: Get Session Info"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_session_info"
    },
    "id": 6
  }' | python -m json.tool
echo ""
echo ""

# Test 8: List Resources
echo "📚 Test 8: List Resources"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","id":7}' | python -m json.tool
echo ""
echo ""

# Test 9: Read Session Summary
echo "📝 Test 9: Read Session Summary"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/summary"
    },
    "id": 8
  }' | python -m json.tool
echo ""
echo ""

# Test 10: Read Recent Contexts
echo "🕒 Test 10: Read Recent Contexts"
curl -s -X POST "$SERVER_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/recent"
    },
    "id": 9
  }' | python -m json.tool
echo ""
echo ""

echo "========================================="
echo "✅ All tests completed!"
echo "========================================="
