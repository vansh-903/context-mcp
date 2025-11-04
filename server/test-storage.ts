/**
 * Simple test script to verify JSON storage works
 */

import { JsonStorage } from './src/storage/json-storage';
import { countTokens } from './src/utils/token-counter';

async function test() {
  console.log('🧪 Testing JSON Storage...\n');

  const storage = new JsonStorage('./data');

  // Initialize
  await storage.initialize();
  console.log('✅ Storage initialized\n');

  // Get session
  const session = await storage.getSession();
  console.log('📋 Session:', {
    id: session.id,
    created: new Date(session.created_at).toLocaleString()
  });
  console.log('');

  // Add some test contexts
  console.log('➕ Adding test contexts...');

  const context1 = await storage.addContext({
    session_id: session.id,
    content: 'Building an MCP server with TypeScript. Using Express for HTTP server and JSON files for storage.',
    entry_type: 'summary',
    source_llm: 'claude',
    token_count: countTokens('Building an MCP server with TypeScript. Using Express for HTTP server and JSON files for storage.')
  });
  console.log(`  ✅ Added context 1: ${context1.id} (${context1.token_count} tokens)`);

  const context2 = await storage.addContext({
    session_id: session.id,
    content: 'Decided to use SQLite for Phase 2. Will migrate from JSON files after testing.',
    entry_type: 'decision',
    source_llm: 'claude',
    token_count: countTokens('Decided to use SQLite for Phase 2. Will migrate from JSON files after testing.')
  });
  console.log(`  ✅ Added context 2: ${context2.id} (${context2.token_count} tokens)`);

  const context3 = await storage.addContext({
    session_id: session.id,
    content: 'TODO: Implement MCP protocol with tools and resources. Add FTS5 search when migrating to SQLite.',
    entry_type: 'note',
    source_llm: 'claude',
    token_count: countTokens('TODO: Implement MCP protocol with tools and resources. Add FTS5 search when migrating to SQLite.')
  });
  console.log(`  ✅ Added context 3: ${context3.id} (${context3.token_count} tokens)`);
  console.log('');

  // Get all contexts
  const allContexts = await storage.getAllContexts();
  console.log(`📚 Total contexts: ${allContexts.length}`);
  console.log('');

  // Search test
  console.log('🔍 Search test: "SQLite"');
  const searchResults = await storage.searchContexts('SQLite');
  console.log(`  Found ${searchResults.length} results:`);
  searchResults.forEach(result => {
    console.log(`    - ${result.entry_type}: ${result.content.substring(0, 60)}...`);
  });
  console.log('');

  // Get recent
  console.log('⏰ Recent contexts (limit 2):');
  const recent = await storage.getRecentContexts(2);
  recent.forEach((ctx, idx) => {
    console.log(`  ${idx + 1}. [${ctx.entry_type}] ${ctx.content.substring(0, 50)}...`);
  });
  console.log('');

  // Total tokens
  const totalTokens = await storage.getTotalTokens();
  console.log(`🎯 Total tokens across all contexts: ${totalTokens}`);
  console.log('');

  console.log('✅ All tests passed!');
}

test().catch(console.error);
