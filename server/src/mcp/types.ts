/**
 * MCP Protocol Types (JSON-RPC 2.0)
 */

// JSON-RPC 2.0 Request
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: string | number;
}

// JSON-RPC 2.0 Response (success)
export interface JsonRpcSuccessResponse {
  jsonrpc: '2.0';
  result: any;
  id: string | number;
}

// JSON-RPC 2.0 Response (error)
export interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

// MCP Error Codes (following JSON-RPC 2.0 spec)
export enum JsonRpcErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}

// MCP Tool Definition
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// MCP Resource Definition
export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

// MCP Methods
export type McpMethod =
  | 'initialize'
  | 'tools/list'
  | 'tools/call'
  | 'resources/list'
  | 'resources/read'
  | 'prompts/list'
  | 'prompts/get';
