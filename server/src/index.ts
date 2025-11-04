import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { JsonStorage } from './storage/json-storage';
import { SqliteStorage } from './storage/sqlite-storage';
import { McpHandler } from './mcp/handler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const DATA_DIR = process.env.DATA_DIR || './data';
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'sqlite'; // 'json' or 'sqlite'

// Initialize storage based on environment variable
const storage = STORAGE_TYPE === 'json'
  ? new JsonStorage(DATA_DIR)
  : new SqliteStorage(DATA_DIR);

const mcpHandler = new McpHandler(storage);

app.use(cors());
app.use(express.json());

// ========== MCP Endpoints ==========

app.post('/mcp/v1/rpc', async (req, res) => {
  try {
    const response = await mcpHandler.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    const requestId = req.body?.id || 'unknown';
    logger.error(`[RPC] Request failed:`, error instanceof Error ? error.message : 'Unknown error');

    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error'
      },
      id: requestId
    });
  }
});

app.get('/mcp/v1/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('event: connected\ndata: {"status":"connected"}\n\n');
  const keepAlive = setInterval(() => res.write(': keepalive\n\n'), 30000);
  req.on('close', () => { clearInterval(keepAlive); res.end(); });
});

// ========== Health & Info Endpoints ==========

app.get('/health', async (req, res) => {
  try {
    logger.info('[Health] Health check requested');

    const [session, contexts, totalTokens] = await Promise.all([
      storage.getSession(),
      storage.getAllContexts(),
      storage.getTotalTokens()
    ]);

    const healthData = {
      status: 'ok',
      session_id: session.id,
      contexts: contexts.length,
      tokens: totalTokens,
      storage: STORAGE_TYPE
    };

    logger.info('[Health] Health check successful', healthData);

    res.json(healthData);
  } catch (error) {
    logger.error('[Health] Health check failed:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    name: 'MCP Context Server',
    version: '1.0.0',
    storage: STORAGE_TYPE,
    endpoints: ['/mcp/v1/rpc', '/mcp/v1/sse', '/health']
  });
});

// Initialize and start server
async function startServer() {
  try {
    logger.info('[Startup] Initializing MCP server...', {
      port: PORT,
      host: HOST,
      storage: STORAGE_TYPE,
      dataDir: DATA_DIR
    });

    await storage.initialize();
    logger.info('[Startup] Storage initialized successfully');

    app.listen(PORT, () => {
      logger.info(`[Startup] 🚀 MCP Server running at http://${HOST}:${PORT}`);
      logger.info(`[Startup] Storage: ${STORAGE_TYPE.toUpperCase()}${STORAGE_TYPE === 'sqlite' ? ' (FTS5)' : ''}`);
      logger.info('[Startup] Available endpoints:', {
        rpc: '/mcp/v1/rpc',
        sse: '/mcp/v1/sse',
        health: '/health',
        root: '/'
      });
    });
  } catch (error) {
    logger.error('[Startup] Server failed to start:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      config: {
        port: PORT,
        host: HOST,
        storage: STORAGE_TYPE,
        dataDir: DATA_DIR
      }
    });
    process.exit(1);
  }
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Process] Unhandled Promise Rejection:', {
    reason,
    promise,
    timestamp: new Date().toISOString()
  });
});

process.on('uncaughtException', (error) => {
  logger.error('[Process] Uncaught Exception:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

startServer();
