// Shared UI components for content scripts

export interface ContextMenuOption {
  name: string;
  value: string;
  icon: string;
  color: string;
}

export function createLoadContextButton(
  currentLLM: string,
  onLoadContext: (sourceLLM: string) => void
): { button: HTMLButtonElement; showMenu: () => void; hideMenu: () => void } {
  let contextMenu: HTMLDivElement | null = null;
  let isMenuOpen = false;

  const button = document.createElement('button');
  button.textContent = '📥 Load Context';
  button.style.cssText = `
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

  button.addEventListener('mouseenter', () => {
    button.style.background = '#4f46e5';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#6366f1';
  });

  function hideMenu() {
    if (contextMenu) {
      contextMenu.remove();
      contextMenu = null;
      isMenuOpen = false;
    }
  }

  function showMenu() {
    if (isMenuOpen && contextMenu) {
      hideMenu();
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

    const allOptions: ContextMenuOption[] = [
      { name: 'Claude', value: 'claude', icon: '🤖', color: '#cc785c' },
      { name: 'ChatGPT', value: 'chatgpt', icon: '💬', color: '#10a37f' },
      { name: 'Gemini', value: 'gemini', icon: '✨', color: '#4285f4' }
    ];

    // Filter out current LLM
    const options = allOptions.filter(opt => opt.value !== currentLLM);

    // Add "All LLMs" option
    options.push({ name: 'All LLMs', value: 'any', icon: '🌐', color: '#6b7280' });

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
        onLoadContext(option.value);
        hideMenu();
      });

      contextMenu!.appendChild(menuItem);
    });

    document.body.appendChild(contextMenu);
    isMenuOpen = true;

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (contextMenu && !contextMenu.contains(e.target as Node) && !button.contains(e.target as Node)) {
          hideMenu();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }

  button.addEventListener('click', showMenu);

  return { button, showMenu, hideMenu };
}

export function createSaveButton(
  onSave: () => void,
  backgroundColor: string = '#2563eb',
  hoverColor: string = '#1d4ed8'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = '💾 Save to MCP';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${backgroundColor};
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
    button.style.background = hoverColor;
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = backgroundColor;
  });

  button.addEventListener('click', onSave);

  return button;
}

export function showNotification(
  message: string,
  type: 'success' | 'error' | 'warning' = 'success'
): void {
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
