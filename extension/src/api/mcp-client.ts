import type { JsonRpcRequest, JsonRpcResponse, ContextEntry, Session, LLMType } from '../types/context';

export class McpClient {
  private baseUrl: string;
  private requestId = 0;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async request(method: string, params?: any): Promise<any> {
    const requestId = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: requestId
    };

    try {
      const response = await fetch(`${this.baseUrl}/mcp/v1/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error(`[MCP Client] HTTP Error:`, response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: JsonRpcResponse = await response.json();

      if (result.error) {
        console.error(`[MCP Client] JSON-RPC Error:`, result.error.message);
        throw new Error(result.error.message);
      }

      return result.result;
    } catch (error) {
      console.error(`[MCP Client] Request failed:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async addContext(
    content: string,
    entryType: 'summary' | 'note' | 'preference' | 'code' | 'decision' = 'summary',
    sourceLLM?: LLMType,
    metadata?: Record<string, any>
  ): Promise<ContextEntry> {
    return this.request('tools/call', {
      name: 'add_context',
      arguments: {
        content,
        entry_type: entryType,
        source_llm: sourceLLM,
        metadata
      }
    });
  }

  async searchContext(query: string, limit: number = 10): Promise<ContextEntry[]> {
    return this.request('tools/call', {
      name: 'search_context',
      arguments: { query, limit }
    });
  }

  async getSessionInfo(): Promise<{ session: Session; entry_count: number; total_tokens: number }> {
    return this.request('tools/call', {
      name: 'get_session_info',
      arguments: {}
    });
  }

  async getSessionSummary(): Promise<{ uri: string; text: string }> {
    return this.request('resources/read', {
      uri: 'session://session/summary'
    });
  }

  async getRecentContexts(limit: number = 10): Promise<{ uri: string; text: string }> {
    return this.request('resources/read', {
      uri: `session://session/recent?limit=${limit}`
    });
  }

  async listContexts(): Promise<{ uri: string; text: string }> {
    return this.request('resources/read', {
      uri: 'session://session/list'
    });
  }

  async getSmartSummary(
    targetLLM: LLMType,
    sourceLLM?: LLMType,
    maxTokens: number = 2500
  ): Promise<{
    content: string;
    originalTokens: number;
    summaryTokens: number;
    compressionRatio: number;
    summarized: boolean;
    message: string;
  }> {
    return this.request('tools/call', {
      name: 'get_smart_summary',
      arguments: {
        source_llm: sourceLLM,
        target_llm: targetLLM,
        max_tokens: maxTokens
      }
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
