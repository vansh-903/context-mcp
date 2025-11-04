interface Stats {
  session: {
    id: string;
    created_at: number;
    last_accessed: number;
  };
  entry_count: number;
  total_tokens: number;
}

const elements = {
  serverStatus: document.getElementById('serverStatus')!,
  statusText: document.getElementById('statusText')!,
  contextCount: document.getElementById('contextCount')!,
  tokenCount: document.getElementById('tokenCount')!,
  currentLLM: document.getElementById('currentLLM')!,
  saveBtn: document.getElementById('saveBtn') as HTMLButtonElement,
  refreshBtn: document.getElementById('refreshBtn') as HTMLButtonElement,
  serverUrl: document.getElementById('serverUrl') as HTMLInputElement,
  autoInject: document.getElementById('autoInject') as HTMLInputElement,
  showNotifications: document.getElementById('showNotifications') as HTMLInputElement,
  saveSettings: document.getElementById('saveSettings') as HTMLButtonElement
};

async function checkServerHealth() {
  const response = await chrome.runtime.sendMessage({ action: 'healthCheck' });

  if (response.success && response.data.healthy) {
    elements.serverStatus.className = 'status-indicator online';
    elements.statusText.textContent = 'Server connected';
    await loadStats();
  } else {
    elements.serverStatus.className = 'status-indicator offline';
    elements.statusText.textContent = 'Server offline';
  }
}

async function loadStats() {
  const response = await chrome.runtime.sendMessage({ action: 'getSessionInfo' });

  if (response.success) {
    const stats: Stats = response.data;
    elements.contextCount.textContent = stats.entry_count.toString();
    elements.tokenCount.textContent = stats.total_tokens.toLocaleString();
  } else {
    elements.contextCount.textContent = '?';
    elements.tokenCount.textContent = '?';
  }
}

async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });

  if (response.success) {
    const settings = response.data;
    elements.serverUrl.value = settings.serverUrl;
    elements.autoInject.checked = settings.autoInject;
    elements.showNotifications.checked = settings.showNotifications;
    elements.currentLLM.textContent = settings.currentLLM || 'None';
  }
}

async function saveSettings() {
  const settings = {
    serverUrl: elements.serverUrl.value,
    autoInject: elements.autoInject.checked,
    showNotifications: elements.showNotifications.checked
  };

  const response = await chrome.runtime.sendMessage({
    action: 'updateSettings',
    data: settings
  });

  if (response.success) {
    showToast('Settings saved');
    await checkServerHealth();
  } else {
    showToast('Failed to save settings', 'error');
  }
}

async function saveCurrentConversation() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.id) return;

  await chrome.tabs.sendMessage(tab.id, { action: 'saveNow' });
  showToast('Saving conversation...');
  setTimeout(loadStats, 1000);
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 1000;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

elements.saveBtn.addEventListener('click', saveCurrentConversation);
elements.refreshBtn.addEventListener('click', () => {
  checkServerHealth();
  loadStats();
});
elements.saveSettings.addEventListener('click', saveSettings);

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  checkServerHealth();
});
