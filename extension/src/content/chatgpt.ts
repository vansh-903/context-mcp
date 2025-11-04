(function() {
const LLM_TYPE = 'chatgpt';

let contextInjected = false;
let loadContextButton: HTMLButtonElement | null = null;
let contextMenu: HTMLDivElement | null = null;
let isMenuOpen = false;

chrome.runtime.sendMessage({ action: 'setLLM', data: { llm: LLM_TYPE } });

async function loadContextFromLLM(sourceLLM: string) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getSmartContext',
      data: {
        targetLLM: LLM_TYPE,
        sourceLLM: sourceLLM,
        maxTokens: 2500
      }
    });

    if (response.success && response.data?.content) {
      const { content, summarized, originalTokens, summaryTokens } = response.data;

      const textarea = document.querySelector('#prompt-textarea') as HTMLTextAreaElement;

      if (textarea) {
        const contextPrefix = `[Context from ${sourceLLM}]\n${content}\n\n[Continue conversation]\n`;

        // Handle both textarea and contenteditable elements
        if (textarea.tagName === 'TEXTAREA') {
          textarea.value = contextPrefix;
        } else if (textarea.getAttribute('contenteditable') === 'true') {
          textarea.textContent = contextPrefix;
        } else {
          // Fallback: try both
          (textarea as any).value = contextPrefix;
          textarea.textContent = contextPrefix;
        }

        // Trigger events
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        textarea.focus();

        if (summarized) {
          showNotification(`Context from ${sourceLLM}: ${originalTokens} → ${summaryTokens} tokens (${Math.round((1 - summaryTokens/originalTokens) * 100)}% compressed)`, 'success');
        } else {
          showNotification(`Context loaded from ${sourceLLM}`, 'success');
        }
      } else {
        console.error('[MCP Extension - ChatGPT] Textarea not found');
        showNotification('Could not find textarea to inject context', 'error');
      }
    } else {
      showNotification(`No context available from ${sourceLLM}`, 'warning');
    }
  } catch (error) {
    console.error('[MCP Extension - ChatGPT] Failed to load context:', error);
    showNotification('Failed to load context', 'error');
  }

  // Close menu after loading
  if (contextMenu) {
    contextMenu.remove();
    contextMenu = null;
    isMenuOpen = false;
  }
}

async function injectContext() {
  if (contextInjected) {
    return;
  }

  try {
    const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const settings = settingsResponse.data;

    if (!settings.autoInject) {
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: 'getSmartContext',
      data: {
        targetLLM: LLM_TYPE,
        sourceLLM: settings.lastUsedLLM,
        maxTokens: 2500
      }
    });

    if (response.success && response.data?.content) {
      const { content, summarized, originalTokens, summaryTokens } = response.data;

      const textarea = document.querySelector('#prompt-textarea') as HTMLTextAreaElement;

      if (textarea) {
        const contextPrefix = `[Context from previous sessions]\n${content}\n\n[Continue conversation]\n`;
        textarea.value = contextPrefix;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        contextInjected = true;

        if (summarized) {
          showNotification(`Context summarized: ${originalTokens} → ${summaryTokens} tokens`, 'success');
        } else {
          showNotification('Context loaded from MCP server', 'success');
        }
      } else {
        console.error('[MCP Extension - ChatGPT] Textarea not found');
      }
    }
  } catch (error) {
    console.error('[MCP Extension - ChatGPT] Failed to inject context:', error);
  }
}

function extractConversation(): string {
  let conversation = '';

  // Strategy 1: Try data-message-author-role attribute (older ChatGPT versions)
  let messages = document.querySelectorAll('[data-message-author-role]');

  // Strategy 2: Try data-testid attribute (newer ChatGPT versions)
  if (messages.length === 0) {
    messages = document.querySelectorAll('[data-testid^="conversation-turn-"]');
  }

  // Strategy 3: Try class-based selection
  if (messages.length === 0) {
    messages = document.querySelectorAll('.group\\/conversation-turn, [class*="conversation-turn"]');
  }

  // Strategy 4: Try finding article elements (ChatGPT wraps messages in articles)
  if (messages.length === 0) {
    messages = document.querySelectorAll('main article, [role="article"]');
  }

  // Strategy 5: Fallback to any text content in main area
  if (messages.length === 0) {
    const mainArea = document.querySelector('main');
    if (mainArea) {
      conversation = mainArea.textContent?.trim() || '';
      return conversation;
    }
  }

  messages.forEach(msg => {
    // Try to get role from various attributes
    const role = msg.getAttribute('data-message-author-role')
      || msg.getAttribute('data-testid')
      || (msg.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role'))
      || 'message';

    const text = msg.textContent?.trim();
    if (text && text.length > 0) {
      conversation += `[${role}] ${text}\n\n`;
    }
  });

  return conversation;
}

async function saveConversation() {
  const conversation = extractConversation();

  if (!conversation || conversation.length < 50) {
    showNotification(`Conversation too short to save (${conversation.length} chars, need 50+)`, 'warning');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'addContext',
      data: {
        content: `ChatGPT conversation:\n\n${conversation}`,
        entryType: 'summary',
        sourceLLM: LLM_TYPE,
        metadata: { url: window.location.href, timestamp: Date.now() }
      }
    });

    if (response.success) {
      showNotification(`Conversation saved successfully (${conversation.length} chars)`, 'success');
    } else {
      const errorMsg = response.error || 'Unknown error';
      console.error('[MCP Extension - ChatGPT] Save failed:', errorMsg);
      showNotification(`Failed to save: ${errorMsg}`, 'error');
    }
  } catch (error) {
    console.error('[MCP Extension - ChatGPT] Save error:', error);
    showNotification(`Error saving conversation: ${error}`, 'error');
  }
}

function showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function toggleContextMenu() {
  if (isMenuOpen && contextMenu) {
    contextMenu.remove();
    contextMenu = null;
    isMenuOpen = false;
    return;
  }

  // Create menu
  contextMenu = document.createElement('div');
  contextMenu.style.cssText = `
    position: fixed;
    bottom: 130px;
    right: 20px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
    z-index: 10001;
    overflow: hidden;
    min-width: 200px;
  `;

  const options = [
    { name: 'Claude', value: 'claude', icon: '🤖', color: '#cc785c' },
    { name: 'Gemini', value: 'gemini', icon: '✨', color: '#4285f4' },
    { name: 'All LLMs', value: 'any', icon: '🌐', color: '#6b7280' }
  ];

  options.forEach((option, index) => {
    const menuItem = document.createElement('button');
    menuItem.textContent = `${option.icon} Load from ${option.name}`;
    menuItem.style.cssText = `
      display: block;
      width: 100%;
      padding: 12px 16px;
      text-align: left;
      background: white;
      border: none;
      border-top: ${index > 0 ? '1px solid #e5e7eb' : 'none'};
      cursor: pointer;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      color: #374151;
      transition: background 0.2s;
    `;

    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.background = '#f3f4f6';
    });

    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'white';
    });

    menuItem.addEventListener('click', () => {
      loadContextFromLLM(option.value);
    });

    contextMenu!.appendChild(menuItem);
  });

  document.body.appendChild(contextMenu);
  isMenuOpen = true;

  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (contextMenu && !contextMenu.contains(e.target as Node) && !loadContextButton?.contains(e.target as Node)) {
        contextMenu.remove();
        contextMenu = null;
        isMenuOpen = false;
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}

function addLoadContextButton() {
  loadContextButton = document.createElement('button');
  loadContextButton.textContent = '📥 Load Context';
  loadContextButton.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: #6366f1;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: background 0.2s;
  `;

  loadContextButton.addEventListener('mouseenter', () => {
    loadContextButton!.style.background = '#4f46e5';
  });

  loadContextButton.addEventListener('mouseleave', () => {
    loadContextButton!.style.background = '#6366f1';
  });

  loadContextButton.addEventListener('click', toggleContextMenu);
  document.body.appendChild(loadContextButton);
}

function addSaveButton() {
  const button = document.createElement('button');
  button.textContent = '💾 Save to MCP';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10a37f;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: background 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = '#0d8968';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#10a37f';
  });

  button.addEventListener('click', saveConversation);
  document.body.appendChild(button);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Automatic injection removed - manual only via Load Context button
    addLoadContextButton();
    addSaveButton();
  });
} else {
  // Automatic injection removed - manual only via Load Context button
  addLoadContextButton();
  addSaveButton();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveNow') {
    saveConversation();
  }
  sendResponse({ success: true });
});

})();
