#!/bin/bash

# MCP Protocol Test Script
# Tests all tools and resources

echo "🧪 Testing MCP Context Server"
echo "=============================="
echo ""

BASE_URL="http://localhost:8000"

# Test 1: Initialize
echo "1️⃣  Testing initialize..."
curl -s -X POST "$BASE_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
  }' | python -m json.tool
echo ""
echo ""

# Test 2: List Tools
echo "2️⃣  Testing tools/list..."
curl -s -X POST "$BASE_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }' | python -m json.tool
echo ""
echo ""

# Test 3: Add Context
echo "3️⃣  Testing add_context tool..."
curl -s -X POST "$BASE_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add_context",
      "arguments": {
        "content": "Testing MCP protocol with curl. All tools and resources working correctly.",
        "entry_type": "summary",
        "source_llm": "claude"
      }
    },
    "id": 3
  }' | python -m json.tool
echo ""
echo ""

# Test 4: Search Context
echo "4️⃣  Testing search_context tool..."
curl -s -X POST "$BASE_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_context",
      "arguments": {
        "query": "MCP",
        "limit": 5
      }
    },
    "id": 4
  }' | python -m json.tool
echo ""
echo ""

# Test 5: Get Session Info
echo "5️⃣  Testing get_session_info tool..."
curl -s -X POST "$BASE_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_session_info",
      "arguments": {}
    },
    "id": 5
  }' | python -m json.tool
echo ""
echo ""

# Test 6: List Resources
echo "6️⃣  Testing resources/list..."
curl -s -X POST "$BASE_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "params": {},
    "id": 6
  }' | python -m json.tool
echo ""
echo ""

# Test 7: Read Summary Resource
echo "7️⃣  Testing context://session/summary resource..."
curl -s -X POST "$BASE_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/summary"
    },
    "id": 7
  }' | python -m json.tool
echo ""
echo ""

# Test 8: Read Recent Resource
echo "8️⃣  Testing context://session/recent resource..."
curl -s -X POST "$BASE_URL/mcp/v1/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "context://session/recent"
    },
    "id": 8
  }' | python -m json.tool
echo ""
echo ""

echo "✅ All MCP tests complete!"
