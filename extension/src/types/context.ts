export interface ContextEntry {
  id: string;
  session_id: string;
  content: string;
  entry_type: 'summary' | 'note' | 'preference' | 'code' | 'decision';
  source_llm?: 'claude' | 'chatgpt' | 'gemini';
  token_count: number;
  created_at: number;
  metadata?: Record<string, any>;
}

export interface Session {
  id: string;
  created_at: number;
  last_accessed: number;
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number | string;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string | null;
}

export type LLMType = 'claude' | 'chatgpt' | 'gemini';

export interface ExtensionSettings {
  serverUrl: string;
  autoInject: boolean;
  showNotifications: boolean;
  currentLLM?: LLMType;
  lastUsedLLM?: LLMType;
}
