# MCP Context Bridge - Browser Extension

Chrome extension for sharing context across Claude.ai, ChatGPT, and Gemini using the MCP Context Server.

## Features

- **Multi-LLM Support**: Works with Claude.ai, ChatGPT, and Gemini
- **Context Injection**: Automatically loads previous conversation context
- **Conversation Saving**: Save conversations to MCP server with one click
- **Real-time Stats**: View context count and token usage
- **Seamless Integration**: Non-intrusive UI with floating save button

## Installation

### 1. Build the Extension

```bash
cd extension
npm install
npm run build
```

### 2. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/dist` folder

### 3. Start MCP Server

```bash
cd ../server
npm run dev
```

The server must be running on `http://localhost:3000` for the extension to work.

## Usage

### Automatic Context Injection

When you visit Claude.ai, ChatGPT, or Gemini:
1. The extension automatically loads context from previous sessions
2. Context is injected into the conversation input
3. You can edit or remove the injected context before sending

### Manual Save

1. Have a conversation with any LLM
2. Click the floating "💾 Save to MCP" button (bottom-right)
3. Conversation is saved to the MCP server
4. Available in next session or when switching to different LLM

### Extension Popup

Click the extension icon to:
- View server connection status
- See context/token statistics
- Manually save current conversation
- Configure settings (server URL, auto-inject, notifications)

## Architecture

```
Browser Extension
├── Content Scripts (inject into each LLM website)
│   ├── claude.ts - Claude.ai integration
│   ├── chatgpt.ts - ChatGPT integration
│   └── gemini.ts - Gemini integration
├── Background Service Worker
│   └── service-worker.ts - MCP client, message routing
├── Popup UI
│   ├── popup.html - Extension popup interface
│   ├── popup.css - Styling
│   └── popup.ts - Stats and settings
└── API Client
    └── mcp-client.ts - MCP protocol HTTP wrapper
```

## Development

### Build for Development (with watch)

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Clean Build Artifacts

```bash
npm run clean
```

## Configuration

Default settings (configurable via popup):
- **Server URL**: `http://localhost:3000`
- **Auto-inject**: Enabled
- **Show notifications**: Enabled

## Troubleshooting

### Extension not loading context

1. Check MCP server is running: `http://localhost:3000/health`
2. Open extension popup to verify "Server connected" status
3. Check browser console for errors (F12 → Console)

### Save button not appearing

1. Refresh the LLM webpage
2. Check extension is enabled in `chrome://extensions/`
3. Verify content script loaded (check console for `[MCP Extension]` logs)

### CORS errors

1. Ensure MCP server has CORS enabled (already configured)
2. Verify server URL in extension settings
3. Check `manifest.json` has correct `host_permissions`

## Future Enhancements (Phase 3)

- Conditional summarization for cross-LLM transfers
- Token optimization and compression
- Advanced context filtering and search
- Multi-session support
- Cloud sync capabilities

## Links

- [MCP Protocol Docs](https://spec.modelcontextprotocol.io/)
- [Server Source](../server)
- [Project Documentation](../PROJECT_DISCUSSION_SUMMARY.md)
