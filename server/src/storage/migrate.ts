/**
 * Migration script: JSON to SQLite
 * Migrates existing JSON data to SQLite database
 */

import fs from 'fs/promises';
import path from 'path';
import { JsonStorage } from './json-storage';
import { SqliteStorage } from './sqlite-storage';
import { logger } from '../utils/logger';

export async function migrateJsonToSqlite(dataDir: string = './data'): Promise<void> {
  logger.info('🔄 Starting migration from JSON to SQLite...');

  try {
    const jsonStorage = new JsonStorage(dataDir);
    const sqliteStorage = new SqliteStorage(dataDir);

    // Initialize SQLite database
    await sqliteStorage.initialize();

    // Check if JSON files exist
    const sessionFile = path.join(dataDir, 'session.json');
    const contextsFile = path.join(dataDir, 'contexts.json');

    try {
      await fs.access(sessionFile);
      await fs.access(contextsFile);
    } catch {
      logger.info('ℹ️  No JSON files found to migrate');
      return;
    }

    // Get all contexts from JSON
    const contexts = await jsonStorage.getAllContexts();

    if (contexts.length === 0) {
      logger.info('ℹ️  No contexts to migrate');
      return;
    }

    logger.info(`📦 Found ${contexts.length} context entries to migrate`);

    // Clear any existing SQLite data
    await sqliteStorage.clearAllContexts();

    // Migrate each context
    let migrated = 0;
    for (const context of contexts) {
      try {
        await sqliteStorage.addContext({
          session_id: context.session_id,
          content: context.content,
          entry_type: context.entry_type,
          source_llm: context.source_llm,
          token_count: context.token_count,
          metadata: context.metadata
        });
        migrated++;
      } catch (error) {
        logger.error(`❌ Failed to migrate context ${context.id}:`, error);
      }
    }

    logger.info(`✅ Successfully migrated ${migrated}/${contexts.length} context entries`);

    // Create backup of JSON files
    const backupDir = path.join(dataDir, 'json-backup');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.copyFile(
      sessionFile,
      path.join(backupDir, `session-${timestamp}.json`)
    );
    await fs.copyFile(
      contextsFile,
      path.join(backupDir, `contexts-${timestamp}.json`)
    );

    logger.info(`📁 JSON files backed up to ${backupDir}`);
    logger.info('✅ Migration complete!');

    // Close SQLite connection
    sqliteStorage.close();

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  const dataDir = process.argv[2] || './data';

  migrateJsonToSqlite(dataDir)
    .then(() => {
      console.log('\n✨ Migration successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}
