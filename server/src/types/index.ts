/**
 * Type definitions for MCP Context Server
 */

// Session represents a user's conversation session
export interface Session {
  id: string;
  created_at: number;
  last_accessed: number;
  metadata?: Record<string, any>;
}

// Context Entry represents a single piece of stored context
export interface ContextEntry {
  id: string;
  session_id: string;
  content: string;
  entry_type: 'summary' | 'note' | 'preference' | 'code' | 'decision';
  source_llm?: 'claude' | 'chatgpt' | 'gemini';
  token_count: number;
  created_at: number;
  updated_at?: number;
  metadata?: Record<string, any>;
}

// Storage interface for JSON operations
export interface StorageData {
  session: Session | null;
  contexts: ContextEntry[];
}

// MCP Tool parameters
export interface AddContextParams {
  content: string;
  entry_type?: string;
  source_llm?: string;
  metadata?: Record<string, any>;
}

export interface UpdateContextParams {
  id: string;
  content: string;
}

export interface SearchContextParams {
  query: string;
  limit?: number;
}

// MCP Tool responses
export interface AddContextResponse {
  id: string;
  created_at: number;
  token_count: number;
}

export interface SearchContextResult {
  id: string;
  content: string;
  entry_type: string;
  created_at: number;
  relevance_score?: number;
}

export interface SessionInfo {
  session_id: string;
  created_at: number;
  last_accessed: number;
  entry_count: number;
  total_tokens: number;
}
