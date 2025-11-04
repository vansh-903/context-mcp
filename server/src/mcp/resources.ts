import { McpResource } from './types';

export const MCP_RESOURCES: McpResource[] = [
  {
    uri: 'context://session/list',
    name: 'List all contexts',
    description: 'Get a list of all context entries in the current session',
    mimeType: 'application/json'
  },
  {
    uri: 'context://session/entry/{id}',
    name: 'Get context entry',
    description: 'Get a specific context entry by ID',
    mimeType: 'application/json'
  },
  {
    uri: 'context://session/summary',
    name: 'Session summary',
    description: 'Get a summary of all context in the current session',
    mimeType: 'text/plain'
  },
  {
    uri: 'context://session/recent',
    name: 'Recent contexts',
    description: 'Get recent context entries (default: last 10)',
    mimeType: 'application/json'
  }
];
