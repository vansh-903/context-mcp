# MCP Context Bridge - Installation Guide

## Prerequisites

1. **MCP Server Running**: Ensure the MCP server is running on `http://localhost:3000`
   ```bash
   cd ../server
   npm run dev
   ```

2. **Chrome Browser**: Version 88 or higher (Manifest V3 support)

## Step 1: Build the Extension

```bash
cd extension
npm install
npm run build
```

This creates a `dist/` folder with all compiled files.

## Step 2: Create Icon Files (Optional)

The extension needs icon files in `extension/icons/`:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can:
- Use any PNG icons you like
- Create simple colored squares
- Use an online icon generator
- Skip this step (Chrome will show a default icon)

## Step 3: Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **"Load unpacked"** button

4. Select the `extension/dist` folder (NOT the `extension` folder)

5. The extension should now appear in your extensions list

6. Pin the extension icon to your toolbar (click puzzle icon → pin MCP Context Bridge)

## Step 4: Verify Installation

1. Click the MCP Context Bridge icon in your toolbar

2. Popup should show:
   - ✅ **Server connected** (green indicator)
   - Context count and token stats
   - Settings panel

3. If "Server offline" (red indicator):
   - Make sure MCP server is running on port 3000
   - Check server URL in settings matches your setup

## Step 5: Test on LLM Websites

### Test on Claude.ai

1. Go to https://claude.ai
2. Start a new conversation
3. You should see a blue "💾 Save to MCP" button (bottom-right)
4. Type a message and have a short conversation
5. Click "💾 Save to MCP" button
6. Green notification should appear: "Conversation saved successfully"

### Test on ChatGPT

1. Go to https://chatgpt.com (or https://chat.openai.com)
2. Start a new conversation
3. Look for the green "💾 Save to MCP" button (bottom-right)
4. Have a conversation and save it

### Test on Gemini

1. Go to https://gemini.google.com
2. Start a new conversation
3. Look for the blue "💾 Save to MCP" button (bottom-right)
4. Have a conversation and save it

## Step 6: Test Context Injection

1. Save a conversation on Claude.ai (as above)
2. Open a NEW tab with Claude.ai (or refresh)
3. The input box should auto-populate with:
   ```
   [Context from previous sessions]
   <your saved context here>

   [Continue conversation]
   ```
4. You can edit or remove this before sending
5. Same works when switching between LLMs!

## Troubleshooting

### "Server offline" in popup

**Problem**: Extension can't reach MCP server

**Solutions**:
- Check server is running: `curl http://localhost:3000/health`
- Restart the server: `cd server && npm run dev`
- Check server URL in extension settings

### Save button not appearing

**Problem**: Content script not loading

**Solutions**:
- Refresh the LLM webpage (F5)
- Check extension is enabled in `chrome://extensions/`
- Open browser console (F12) and look for `[MCP Extension]` logs
- Reload the extension (click reload icon in chrome://extensions/)

### Context not injecting

**Problem**: Injection logic not triggering

**Solutions**:
- Wait 2-3 seconds after page loads
- Make sure you've saved at least one conversation
- Check extension popup shows context count > 0
- Verify "Auto-inject context" is enabled in settings

### CORS errors in console

**Problem**: Browser blocking requests to MCP server

**Solutions**:
- MCP server already has CORS enabled by default
- Check `manifest.json` has `http://localhost:3000/*` in `host_permissions`
- Verify server is running on the correct port

### Extension icons not showing

**Problem**: Missing icon files

**Solutions**:
- Create placeholder icons in `extension/icons/` folder
- Or ignore - Chrome will use default icons
- Icons don't affect functionality

## Development Mode

For active development with auto-reload:

```bash
# Terminal 1: Run server
cd server
npm run dev

# Terminal 2: Build extension with watch mode
cd extension
npm run dev
```

After code changes:
1. Extension rebuilds automatically
2. Go to `chrome://extensions/`
3. Click the reload icon for MCP Context Bridge
4. Refresh any open LLM tabs

## Configuration

Click the extension icon to access settings:

- **Server URL**: Change if MCP server runs on different port
- **Auto-inject context**: Enable/disable automatic context loading
- **Show notifications**: Toggle success/error notifications

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "MCP Context Bridge"
3. Click "Remove"
4. Confirm removal

## Next Steps

- Save conversations across different LLMs
- Test context sharing (save on Claude → load on ChatGPT)
- Explore the MCP server API documentation
- Phase 3: Smart summarization (coming soon)

## Support

- [Server Documentation](../server/README.md)
- [Project Overview](../PROJECT_DISCUSSION_SUMMARY.md)
- [MCP Protocol Spec](https://spec.modelcontextprotocol.io/)
