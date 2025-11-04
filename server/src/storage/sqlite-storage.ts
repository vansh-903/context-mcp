import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Session, ContextEntry } from '../types';
import { IStorage } from './storage-interface';

export class SqliteStorage implements IStorage {
  private db: Database.Database;
  private dbPath: string;

  constructor(dataDir: string = './data') {
    this.dbPath = path.join(dataDir, 'context.db');
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  async initialize(): Promise<void> {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          created_at INTEGER NOT NULL,
          last_accessed INTEGER NOT NULL,
          metadata TEXT
        )
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS contexts (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          content TEXT NOT NULL,
          entry_type TEXT DEFAULT 'summary',
          source_llm TEXT,
          token_count INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER,
          metadata TEXT,
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
      `);

      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS contexts_fts USING fts5(
          content,
          content='contexts',
          content_rowid='rowid'
        )
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS contexts_ai AFTER INSERT ON contexts BEGIN
          INSERT INTO contexts_fts(rowid, content) VALUES (new.rowid, new.content);
        END
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS contexts_ad AFTER DELETE ON contexts BEGIN
          INSERT INTO contexts_fts(contexts_fts, rowid, content) VALUES('delete', old.rowid, old.content);
        END
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS contexts_au AFTER UPDATE ON contexts BEGIN
          INSERT INTO contexts_fts(contexts_fts, rowid, content) VALUES('delete', old.rowid, old.content);
          INSERT INTO contexts_fts(rowid, content) VALUES (new.rowid, new.content);
        END
      `);

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_contexts_session_id ON contexts(session_id);
        CREATE INDEX IF NOT EXISTS idx_contexts_created_at ON contexts(created_at);
        CREATE INDEX IF NOT EXISTS idx_contexts_entry_type ON contexts(entry_type);
        CREATE INDEX IF NOT EXISTS idx_contexts_source_llm ON contexts(source_llm);
      `);

      const sessionExists = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
      if (sessionExists.count === 0) {
        const session: Session = { id: uuidv4(), created_at: Date.now(), last_accessed: Date.now() };
        this.db.prepare('INSERT INTO sessions (id, created_at, last_accessed, metadata) VALUES (?, ?, ?, ?)').run(
          session.id, session.created_at, session.last_accessed, null
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async getSession(): Promise<Session> {
    const row = this.db.prepare('SELECT * FROM sessions LIMIT 1').get() as any;
    if (!row) throw new Error('No session found');

    const session: Session = {
      id: row.id,
      created_at: row.created_at,
      last_accessed: row.last_accessed,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };

    this.db.prepare('UPDATE sessions SET last_accessed = ? WHERE id = ?').run(Date.now(), session.id);
    return session;
  }

  async saveSession(session: Session): Promise<void> {
    this.db.prepare('UPDATE sessions SET last_accessed = ?, metadata = ? WHERE id = ?').run(
      session.last_accessed,
      session.metadata ? JSON.stringify(session.metadata) : null,
      session.id
    );
  }

  async getAllContexts(): Promise<ContextEntry[]> {
    const rows = this.db.prepare('SELECT * FROM contexts ORDER BY created_at DESC').all() as any[];
    return rows.map(row => this.rowToContextEntry(row));
  }

  async getContextById(id: string): Promise<ContextEntry | null> {
    const row = this.db.prepare('SELECT * FROM contexts WHERE id = ?').get(id) as any;
    return row ? this.rowToContextEntry(row) : null;
  }

  async addContext(entry: Omit<ContextEntry, 'id' | 'created_at'>): Promise<ContextEntry> {
    const newEntry: ContextEntry = { ...entry, id: uuidv4(), created_at: Date.now() };
    this.db.prepare('INSERT INTO contexts (id, session_id, content, entry_type, source_llm, token_count, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      newEntry.id,
      newEntry.session_id,
      newEntry.content,
      newEntry.entry_type,
      newEntry.source_llm || null,
      newEntry.token_count,
      newEntry.created_at,
      newEntry.metadata ? JSON.stringify(newEntry.metadata) : null
    );
    return newEntry;
  }

  async updateContext(id: string, updates: Partial<ContextEntry>): Promise<ContextEntry | null> {
    const existing = await this.getContextById(id);
    if (!existing) return null;

    const updatedEntry: ContextEntry = { ...existing, ...updates, updated_at: Date.now() };
    this.db.prepare('UPDATE contexts SET content = ?, entry_type = ?, source_llm = ?, token_count = ?, updated_at = ?, metadata = ? WHERE id = ?').run(
      updatedEntry.content,
      updatedEntry.entry_type,
      updatedEntry.source_llm || null,
      updatedEntry.token_count,
      updatedEntry.updated_at,
      updatedEntry.metadata ? JSON.stringify(updatedEntry.metadata) : null,
      id
    );
    return updatedEntry;
  }

  async deleteContext(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM contexts WHERE id = ?').run(id);
    return result.changes > 0;
  }

  async searchContexts(query: string, limit: number = 10): Promise<ContextEntry[]> {
    try {
      const rows = this.db.prepare('SELECT c.* FROM contexts c INNER JOIN contexts_fts fts ON c.rowid = fts.rowid WHERE contexts_fts MATCH ? ORDER BY rank, c.created_at DESC LIMIT ?').all(query, limit) as any[];
      return rows.map(row => this.rowToContextEntry(row));
    } catch (error) {
      const rows = this.db.prepare('SELECT * FROM contexts WHERE content LIKE ? ORDER BY created_at DESC LIMIT ?').all(`%${query}%`, limit) as any[];
      return rows.map(row => this.rowToContextEntry(row));
    }
  }

  async getRecentContexts(limit: number = 10): Promise<ContextEntry[]> {
    const rows = this.db.prepare('SELECT * FROM contexts ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(row => this.rowToContextEntry(row));
  }

  async getTotalTokens(): Promise<number> {
    const result = this.db.prepare('SELECT SUM(token_count) as total FROM contexts').get() as { total: number | null };
    return result.total || 0;
  }

  async clearAllContexts(): Promise<void> {
    this.db.prepare('DELETE FROM contexts').run();
  }

  close(): void {
    this.db.close();
  }

  private rowToContextEntry(row: any): ContextEntry {
    return {
      id: row.id,
      session_id: row.session_id,
      content: row.content,
      entry_type: row.entry_type,
      source_llm: row.source_llm,
      token_count: row.token_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }
}
