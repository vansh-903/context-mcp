import { McpTool } from './types';

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'add_context',
    description: 'Add a new context entry (conversation summary, note, decision, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The context content to store'
        },
        entry_type: {
          type: 'string',
          enum: ['summary', 'note', 'preference', 'code', 'decision'],
          description: 'Type of context entry',
          default: 'summary'
        },
        source_llm: {
          type: 'string',
          enum: ['claude', 'chatgpt', 'gemini'],
          description: 'Which LLM created this context'
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (optional)'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'update_context',
    description: 'Update an existing context entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the context entry to update'
        },
        content: {
          type: 'string',
          description: 'New content for the entry'
        }
      },
      required: ['id', 'content']
    }
  },
  {
    name: 'search_context',
    description: 'Search through stored context entries',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_session_info',
    description: 'Get information about the current session',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_smart_summary',
    description: 'Get intelligently summarized context with conditional compression based on LLM switch and token count',
    inputSchema: {
      type: 'object',
      properties: {
        source_llm: {
          type: 'string',
          enum: ['claude', 'chatgpt', 'gemini'],
          description: 'The LLM used in previous session'
        },
        target_llm: {
          type: 'string',
          enum: ['claude', 'chatgpt', 'gemini'],
          description: 'The LLM being used now'
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum tokens for summary (default: 2500)',
          default: 2500
        }
      },
      required: ['target_llm']
    }
  }
];
