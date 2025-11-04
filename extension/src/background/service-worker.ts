import { McpClient } from '../api/mcp-client';
import type { ExtensionSettings, LLMType } from '../types/context';

const DEFAULT_SETTINGS: ExtensionSettings = {
  serverUrl: 'http://localhost:3000',
  autoInject: true,
  showNotifications: true
};

let mcpClient: McpClient;
let settings: ExtensionSettings = DEFAULT_SETTINGS;

// Initialize immediately
async function initializeExtension() {
  const stored = await chrome.storage.local.get('settings');
  settings = { ...DEFAULT_SETTINGS, ...stored.settings };
  mcpClient = new McpClient(settings.serverUrl);
}

// Initialize on startup
initializeExtension();

chrome.runtime.onInstalled.addListener(async () => {
  await initializeExtension();
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeExtension();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true;
});

async function handleMessage(message: any, sender: chrome.runtime.MessageSender) {
  const { action, data } = message;

  try {
    // Ensure mcpClient is initialized
    if (!mcpClient && action !== 'getSettings') {
      await initializeExtension();
    }

    switch (action) {
      case 'getSettings':
        return { success: true, data: settings };

      case 'updateSettings':
        settings = { ...settings, ...data };
        await chrome.storage.local.set({ settings });
        mcpClient = new McpClient(settings.serverUrl);
        return { success: true };

      case 'addContext':
        const entry = await mcpClient.addContext(
          data.content,
          data.entryType,
          data.sourceLLM,
          data.metadata
        );
        if (settings.showNotifications) {
          // Simple 48x48 transparent PNG as data URL
          const iconDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          chrome.notifications.create({
            type: 'basic',
            iconUrl: iconDataUrl,
            title: 'Context Saved',
            message: `Saved ${data.entryType} from ${data.sourceLLM}`
          });
        }
        return { success: true, data: entry };

      case 'getContext':
        const summary = await mcpClient.getSessionSummary();
        return { success: true, data: summary };

      case 'getSmartContext':
        const smartSummary = await mcpClient.getSmartSummary(
          data.targetLLM,
          data.sourceLLM,
          data.maxTokens
        );
        return { success: true, data: smartSummary };

      case 'searchContext':
        const results = await mcpClient.searchContext(data.query, data.limit);
        return { success: true, data: results };

      case 'getSessionInfo':
        const info = await mcpClient.getSessionInfo();
        return { success: true, data: info };

      case 'healthCheck':
        const healthy = await mcpClient.healthCheck();
        return { success: true, data: { healthy } };

      case 'setLLM':
        settings.lastUsedLLM = settings.currentLLM;
        settings.currentLLM = data.llm;
        await chrome.storage.local.set({ settings });
        return { success: true };

      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
