import { IStorage } from '../storage/storage-interface';
import { countTokens } from '../utils/token-counter';
import { Summarizer } from '../services/summarizer';
import { JsonRpcRequest, JsonRpcResponse, JsonRpcErrorCode, JsonRpcSuccessResponse, JsonRpcErrorResponse } from './types';
import { MCP_TOOLS } from './tools';
import { MCP_RESOURCES } from './resources';
import { logger } from '../utils/logger';

export class McpHandler {
  private storage: IStorage;
  private summarizer: Summarizer;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.summarizer = new Summarizer();
  }

  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      if (request.jsonrpc !== '2.0') {
        return this.errorResponse(request.id, JsonRpcErrorCode.InvalidRequest, 'Invalid JSON-RPC version');
      }

      switch (request.method) {
        case 'initialize': return this.handleInitialize(request);
        case 'tools/list': return this.handleToolsList(request);
        case 'tools/call': return this.handleToolsCall(request);
        case 'resources/list': return this.handleResourcesList(request);
        case 'resources/read': return this.handleResourcesRead(request);
        default:
          return this.errorResponse(request.id, JsonRpcErrorCode.MethodNotFound, `Method not found: ${request.method}`);
      }
    } catch (error) {
      logger.error(`[Handler] Error:`, error instanceof Error ? error.message : 'Internal error');
      return this.errorResponse(request.id, JsonRpcErrorCode.InternalError, error instanceof Error ? error.message : 'Internal error');
    }
  }

  private async handleInitialize(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const session = await this.storage.getSession();
    return this.successResponse(request.id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, resources: {} },
      serverInfo: { name: 'context-mcp-server', version: '1.0.0' },
      sessionId: session.id
    });
  }

  private handleToolsList(request: JsonRpcRequest): JsonRpcResponse {
    return this.successResponse(request.id, { tools: MCP_TOOLS });
  }

  private async handleToolsCall(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { name, arguments: args } = request.params || {};
    if (!name) return this.errorResponse(request.id, JsonRpcErrorCode.InvalidParams, 'Tool name is required');

    switch (name) {
      case 'add_context': return this.toolAddContext(request.id, args);
      case 'update_context': return this.toolUpdateContext(request.id, args);
      case 'search_context': return this.toolSearchContext(request.id, args);
      case 'get_session_info': return this.toolGetSessionInfo(request.id);
      case 'get_smart_summary': return this.toolGetSmartSummary(request.id, args);
      default: return this.errorResponse(request.id, JsonRpcErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  private handleResourcesList(request: JsonRpcRequest): JsonRpcResponse {
    return this.successResponse(request.id, { resources: MCP_RESOURCES });
  }

  private async handleResourcesRead(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { uri } = request.params || {};
    if (!uri) return this.errorResponse(request.id, JsonRpcErrorCode.InvalidParams, 'Resource URI is required');

    if (uri === 'context://session/list') return this.resourceListContexts(request.id);
    if (uri.startsWith('context://session/entry/')) return this.resourceGetContext(request.id, uri.replace('context://session/entry/', ''));
    if (uri === 'context://session/summary') return this.resourceGetSummary(request.id);
    if (uri === 'context://session/recent') return this.resourceGetRecent(request.id);
    return this.errorResponse(request.id, JsonRpcErrorCode.InvalidParams, `Unknown resource URI: ${uri}`);
  }

  private async toolAddContext(id: string | number, args: any): Promise<JsonRpcResponse> {
    const { content, entry_type = 'summary', source_llm, metadata } = args || {};

    if (!content) {
      return this.errorResponse(id, JsonRpcErrorCode.InvalidParams, 'Content is required');
    }

    try {
      const session = await this.storage.getSession();
      const tokenCount = countTokens(content);

      const entry = await this.storage.addContext({
        session_id: session.id,
        content,
        entry_type,
        source_llm,
        token_count: tokenCount,
        metadata
      });

      return this.successResponse(id, {
        id: entry.id,
        created_at: entry.created_at,
        token_count: entry.token_count
      });
    } catch (error) {
      logger.error('[Tool:add_context] Failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async toolUpdateContext(id: string | number, args: any): Promise<JsonRpcResponse> {
    const { id: entryId, content } = args || {};
    if (!entryId || !content) return this.errorResponse(id, JsonRpcErrorCode.InvalidParams, 'Entry ID and content are required');

    const tokenCount = countTokens(content);
    const updated = await this.storage.updateContext(entryId, { content, token_count: tokenCount });

    if (!updated) return this.errorResponse(id, JsonRpcErrorCode.InvalidParams, `Context entry not found: ${entryId}`);
    return this.successResponse(id, { success: true, updated_at: updated.updated_at });
  }

  private async toolSearchContext(id: string | number, args: any): Promise<JsonRpcResponse> {
    const { query, limit = 10 } = args || {};
    if (!query) return this.errorResponse(id, JsonRpcErrorCode.InvalidParams, 'Search query is required');

    const results = await this.storage.searchContexts(query, limit);
    return this.successResponse(id, {
      results: results.map(r => ({ id: r.id, content: r.content, entry_type: r.entry_type, created_at: r.created_at, token_count: r.token_count }))
    });
  }

  private async toolGetSessionInfo(id: string | number): Promise<JsonRpcResponse> {
    const session = await this.storage.getSession();
    const contexts = await this.storage.getAllContexts();
    const totalTokens = await this.storage.getTotalTokens();

    return this.successResponse(id, {
      session_id: session.id,
      created_at: session.created_at,
      last_accessed: session.last_accessed,
      entry_count: contexts.length,
      total_tokens: totalTokens
    });
  }

  private async toolGetSmartSummary(id: string | number, args: any): Promise<JsonRpcResponse> {
    const { source_llm, target_llm, max_tokens = 2500 } = args || {};

    if (!target_llm) {
      return this.errorResponse(id, JsonRpcErrorCode.InvalidParams, 'target_llm is required');
    }

    try {
      const contexts = await this.storage.getAllContexts();

      if (contexts.length === 0) {
        return this.successResponse(id, {
          content: '',
          originalTokens: 0,
          summaryTokens: 0,
          compressionRatio: 1.0,
          summarized: false,
          message: 'No context available'
        });
      }

      const shouldSummarize = this.summarizer.shouldSummarize(contexts, source_llm, target_llm, max_tokens);

      if (!shouldSummarize) {
        const fullContext = contexts.map(c => c.content).join('\n\n');
        const tokens = this.summarizer.countTokens(fullContext);

        return this.successResponse(id, {
          content: fullContext,
          originalTokens: tokens,
          summaryTokens: tokens,
          compressionRatio: 1.0,
          summarized: false,
          message: 'Context size acceptable, no summarization needed'
        });
      }

      const summary = this.summarizer.summarize(contexts, max_tokens);

      return this.successResponse(id, {
        content: summary.content,
        originalTokens: summary.originalTokens,
        summaryTokens: summary.summaryTokens,
        compressionRatio: summary.compressionRatio,
        summarized: summary.summarized,
        message: summary.summarized
          ? `Summarized: ${summary.originalTokens} → ${summary.summaryTokens} tokens (${Math.round(summary.compressionRatio * 100)}% of original)`
          : 'No summarization needed'
      });
    } catch (error) {
      logger.error('[Tool:get_smart_summary] Failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async resourceListContexts(id: string | number): Promise<JsonRpcResponse> {
    const contexts = await this.storage.getAllContexts();
    return this.successResponse(id, {
      contents: [{
        uri: 'context://session/list',
        mimeType: 'application/json',
        text: JSON.stringify(contexts.map(c => ({ id: c.id, entry_type: c.entry_type, source_llm: c.source_llm, token_count: c.token_count, created_at: c.created_at, preview: c.content.substring(0, 100) })), null, 2)
      }]
    });
  }

  private async resourceGetContext(id: string | number, entryId: string): Promise<JsonRpcResponse> {
    const entry = await this.storage.getContextById(entryId);
    if (!entry) return this.errorResponse(id, JsonRpcErrorCode.InvalidParams, `Context entry not found: ${entryId}`);

    return this.successResponse(id, {
      contents: [{
        uri: `context://session/entry/${entryId}`,
        mimeType: 'application/json',
        text: JSON.stringify(entry, null, 2)
      }]
    });
  }

  private async resourceGetSummary(id: string | number): Promise<JsonRpcResponse> {
    const contexts = await this.storage.getAllContexts();
    let summary = '# Session Context Summary\n\n';

    if (contexts.length === 0) {
      summary += 'No context entries yet.\n';
    } else {
      summary += `Total entries: ${contexts.length}\n\n`;
      const byType: Record<string, typeof contexts> = {};
      contexts.forEach(c => {
        if (!byType[c.entry_type]) byType[c.entry_type] = [];
        byType[c.entry_type].push(c);
      });

      Object.entries(byType).forEach(([type, entries]) => {
        summary += `## ${type.charAt(0).toUpperCase() + type.slice(1)} (${entries.length})\n\n`;
        entries.forEach(entry => {
          summary += `- ${entry.content}\n`;
          if (entry.source_llm) summary += `  *Source: ${entry.source_llm}*\n`;
          summary += '\n';
        });
      });
    }

    return this.successResponse(id, { contents: [{ uri: 'context://session/summary', mimeType: 'text/plain', text: summary }] });
  }

  private async resourceGetRecent(id: string | number): Promise<JsonRpcResponse> {
    const recent = await this.storage.getRecentContexts(10);
    return this.successResponse(id, { contents: [{ uri: 'context://session/recent', mimeType: 'application/json', text: JSON.stringify(recent, null, 2) }] });
  }

  private successResponse(id: string | number, result: any): JsonRpcSuccessResponse {
    return { jsonrpc: '2.0', result, id };
  }

  private errorResponse(id: string | number | null, code: JsonRpcErrorCode, message: string, data?: any): JsonRpcErrorResponse {
    return { jsonrpc: '2.0', error: { code, message, ...(data && { data }) }, id };
  }
}
