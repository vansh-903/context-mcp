# MCP Context Bridge - Testing Checklist

## Pre-Testing Setup

- [ ] MCP server is running on `http://localhost:3000`
- [ ] Extension is built (`npm run build` completed successfully)
- [ ] Extension is loaded in Chrome (`chrome://extensions/`)
- [ ] Extension icon is visible in Chrome toolbar

## Test 1: Extension Installation

- [ ] Extension appears in `chrome://extensions/`
- [ ] No errors shown in extension details
- [ ] Extension icon visible in toolbar
- [ ] Can click extension icon to open popup

## Test 2: Server Connection

- [ ] Click extension icon
- [ ] Popup opens successfully
- [ ] Status shows "Server connected" with green indicator
- [ ] Stats show: Contexts: 0, Tokens: 0, Current LLM: None
- [ ] All UI elements render correctly

## Test 3: Settings Management

- [ ] Click extension icon to open popup
- [ ] Server URL field shows `http://localhost:3000`
- [ ] "Auto-inject context" checkbox is checked
- [ ] "Show notifications" checkbox is checked
- [ ] Change server URL to `http://localhost:3001`
- [ ] Click "Save Settings"
- [ ] Status changes to "Server offline" (red indicator)
- [ ] Change server URL back to `http://localhost:3000`
- [ ] Click "Save Settings"
- [ ] Status changes back to "Server connected" (green indicator)

## Test 4: Claude.ai Integration

### A. Content Script Loading
- [ ] Navigate to https://claude.ai
- [ ] Page loads completely
- [ ] Blue "💾 Save to MCP" button appears (bottom-right corner)
- [ ] Button is visible and clickable
- [ ] Open browser console (F12) - no errors

### B. Conversation Saving
- [ ] Start a new conversation on Claude
- [ ] Type: "Hello, this is a test conversation"
- [ ] Wait for Claude's response
- [ ] Click "💾 Save to MCP" button
- [ ] Green notification appears: "Conversation saved successfully"
- [ ] Notification disappears after 3 seconds
- [ ] Click extension icon
- [ ] Context count increased to 1
- [ ] Token count shows non-zero value
- [ ] Current LLM shows "claude"

### C. Context Injection
- [ ] Open NEW Claude.ai tab (or refresh existing)
- [ ] Wait 2 seconds for injection
- [ ] Input textarea contains injected context:
  ```
  [Context from previous sessions]
  <your saved conversation>

  [Continue conversation]
  ```
- [ ] Context is editable
- [ ] Can delete context if desired
- [ ] Can add new text after context

## Test 5: ChatGPT Integration

### A. Content Script Loading
- [ ] Navigate to https://chatgpt.com or https://chat.openai.com
- [ ] Page loads completely
- [ ] Green "💾 Save to MCP" button appears (bottom-right corner)
- [ ] Button is visible and clickable

### B. Conversation Saving
- [ ] Start a new conversation
- [ ] Type: "This is a ChatGPT test conversation"
- [ ] Wait for ChatGPT's response
- [ ] Click "💾 Save to MCP" button
- [ ] Green notification appears: "Conversation saved successfully"
- [ ] Extension popup shows context count increased

### C. Context Injection
- [ ] Open NEW ChatGPT tab
- [ ] Wait 2 seconds
- [ ] Input field contains previous context
- [ ] Context includes both Claude AND ChatGPT conversations

## Test 6: Gemini Integration

### A. Content Script Loading
- [ ] Navigate to https://gemini.google.com
- [ ] Page loads completely
- [ ] Blue "💾 Save to MCP" button appears (bottom-right corner)
- [ ] Button is visible and clickable

### B. Conversation Saving
- [ ] Start a new conversation
- [ ] Type: "This is a Gemini test"
- [ ] Wait for Gemini's response
- [ ] Click "💾 Save to MCP" button
- [ ] Green notification appears
- [ ] Extension popup shows increased context count

### C. Context Injection
- [ ] Open NEW Gemini tab
- [ ] Wait 2 seconds
- [ ] Input field contains context from all previous LLMs

## Test 7: Cross-LLM Context Sharing

- [ ] Save conversation on Claude.ai (Test 4B)
- [ ] Open ChatGPT in new tab
- [ ] ChatGPT receives Claude's context
- [ ] Have conversation on ChatGPT and save it
- [ ] Open Gemini in new tab
- [ ] Gemini receives context from both Claude AND ChatGPT
- [ ] All three LLMs share the same memory

## Test 8: Manual Save from Popup

- [ ] Open any LLM website
- [ ] Have a short conversation
- [ ] Click extension icon (don't use floating button)
- [ ] Click "💾 Save Conversation" in popup
- [ ] Toast notification appears in popup
- [ ] Context count increases
- [ ] Conversation is saved successfully

## Test 9: Refresh Stats

- [ ] Save a conversation
- [ ] Click extension icon
- [ ] Note current stats (contexts: X, tokens: Y)
- [ ] Click "🔄 Refresh Stats" button
- [ ] Stats update correctly
- [ ] No errors in console

## Test 10: Error Handling

### A. Server Offline
- [ ] Stop the MCP server
- [ ] Click extension icon
- [ ] Status shows "Server offline" (red indicator)
- [ ] Try to save conversation
- [ ] Error notification appears
- [ ] Restart server
- [ ] Click "🔄 Refresh Stats"
- [ ] Status returns to "Server connected"

### B. Empty Conversation
- [ ] Open Claude.ai
- [ ] Click "💾 Save to MCP" immediately (no conversation)
- [ ] Warning notification: "Conversation too short to save"
- [ ] No context added to server

### C. Invalid Server URL
- [ ] Open extension settings
- [ ] Change URL to `http://invalid:9999`
- [ ] Click "Save Settings"
- [ ] Status shows "Server offline"
- [ ] Change back to correct URL
- [ ] Status returns to "Server connected"

## Test 11: Notifications

### A. Success Notifications
- [ ] Enable "Show notifications" in settings
- [ ] Save a conversation
- [ ] Green notification appears with success message
- [ ] Notification auto-dismisses after 3 seconds

### B. Disable Notifications
- [ ] Disable "Show notifications" in settings
- [ ] Save a conversation
- [ ] NO notification appears on save
- [ ] But conversation is still saved (check popup stats)

## Test 12: Browser Console

For each LLM website, check browser console (F12):

### Claude.ai Console
- [ ] No errors related to MCP Extension
- [ ] May see `[MCP Extension]` info logs
- [ ] No CORS errors

### ChatGPT Console
- [ ] No errors related to MCP Extension
- [ ] May see `[MCP Extension]` info logs
- [ ] No CORS errors

### Gemini Console
- [ ] No errors related to MCP Extension
- [ ] May see `[MCP Extension]` info logs
- [ ] No CORS errors

## Test 13: Extension Background Service Worker

- [ ] Go to `chrome://extensions/`
- [ ] Find MCP Context Bridge
- [ ] Click "service worker" link (under "Inspect views")
- [ ] Console opens for background script
- [ ] No errors visible
- [ ] Try saving conversation
- [ ] See message traffic in console
- [ ] No errors during message handling

## Test 14: Performance

- [ ] Save 5+ conversations across different LLMs
- [ ] Extension popup opens quickly (< 1 second)
- [ ] Stats load quickly
- [ ] Context injection happens within 2 seconds
- [ ] No noticeable page slowdown
- [ ] Browser remains responsive

## Test 15: Data Persistence

- [ ] Save 3 conversations
- [ ] Close Chrome completely
- [ ] Restart Chrome
- [ ] Click extension icon
- [ ] Context count shows same value (3)
- [ ] Open any LLM website
- [ ] Context still injects correctly
- [ ] All data persisted across browser restart

## Expected Results Summary

After completing all tests:

✅ **All tests passing** = Extension ready for use
⚠️ **1-2 tests failing** = Review logs, fix issues
❌ **Multiple tests failing** = Review installation, rebuild extension

## Common Issues

| Issue | Solution |
|-------|----------|
| Save button not appearing | Refresh page, check console for errors |
| Context not injecting | Wait 2-3 seconds, check auto-inject enabled |
| Server offline | Start MCP server, verify port 3000 |
| CORS errors | MCP server should have CORS enabled by default |
| Stats not updating | Click refresh button, check server connection |

## Next Steps After Testing

Once all tests pass:
- [ ] Extension is ready for daily use
- [ ] Can start using across all three LLMs
- [ ] Context will be shared automatically
- [ ] Phase 2 (Browser Extension) is complete ✅
- [ ] Ready to proceed to Phase 3 (Smart Summarization)

## Reporting Issues

If tests fail:
1. Note which test(s) failed
2. Check browser console for errors
3. Check MCP server logs
4. Review INSTALLATION.md troubleshooting section
5. Check that all files built correctly in `dist/` folder
