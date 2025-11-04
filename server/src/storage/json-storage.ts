import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Session, ContextEntry, StorageData } from '../types';
import { IStorage } from './storage-interface';

export class JsonStorage implements IStorage {
  private dataDir: string;
  private sessionFile: string;
  private contextsFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.sessionFile = path.join(dataDir, 'session.json');
    this.contextsFile = path.join(dataDir, 'contexts.json');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

    try {
      await fs.access(this.sessionFile);
    } catch {
      const session: Session = { id: uuidv4(), created_at: Date.now(), last_accessed: Date.now() };
      await fs.writeFile(this.sessionFile, JSON.stringify(session, null, 2));
    }

    try {
      await fs.access(this.contextsFile);
    } catch {
      await fs.writeFile(this.contextsFile, JSON.stringify([], null, 2));
    }
  }

  async getSession(): Promise<Session> {
    const data = await fs.readFile(this.sessionFile, 'utf-8');
    const session = JSON.parse(data) as Session;
    session.last_accessed = Date.now();
    await this.saveSession(session);
    return session;
  }

  async saveSession(session: Session): Promise<void> {
    await fs.writeFile(this.sessionFile, JSON.stringify(session, null, 2));
  }

  async getAllContexts(): Promise<ContextEntry[]> {
    const data = await fs.readFile(this.contextsFile, 'utf-8');
    return JSON.parse(data) as ContextEntry[];
  }

  async getContextById(id: string): Promise<ContextEntry | null> {
    const contexts = await this.getAllContexts();
    return contexts.find(ctx => ctx.id === id) || null;
  }

  async addContext(entry: Omit<ContextEntry, 'id' | 'created_at'>): Promise<ContextEntry> {
    const contexts = await this.getAllContexts();
    const newEntry: ContextEntry = { ...entry, id: uuidv4(), created_at: Date.now() };
    contexts.push(newEntry);
    await fs.writeFile(this.contextsFile, JSON.stringify(contexts, null, 2));
    return newEntry;
  }

  async updateContext(id: string, updates: Partial<ContextEntry>): Promise<ContextEntry | null> {
    const contexts = await this.getAllContexts();
    const index = contexts.findIndex(ctx => ctx.id === id);
    if (index === -1) return null;

    contexts[index] = { ...contexts[index], ...updates, updated_at: Date.now() };
    await fs.writeFile(this.contextsFile, JSON.stringify(contexts, null, 2));
    return contexts[index];
  }

  async deleteContext(id: string): Promise<boolean> {
    const contexts = await this.getAllContexts();
    const filtered = contexts.filter(ctx => ctx.id !== id);
    if (filtered.length === contexts.length) return false;

    await fs.writeFile(this.contextsFile, JSON.stringify(filtered, null, 2));
    return true;
  }

  async searchContexts(query: string, limit: number = 10): Promise<ContextEntry[]> {
    const contexts = await this.getAllContexts();
    const lowerQuery = query.toLowerCase();
    const matches = contexts.filter(ctx => ctx.content.toLowerCase().includes(lowerQuery));
    matches.sort((a, b) => b.created_at - a.created_at);
    return matches.slice(0, limit);
  }

  async getRecentContexts(limit: number = 10): Promise<ContextEntry[]> {
    const contexts = await this.getAllContexts();
    contexts.sort((a, b) => b.created_at - a.created_at);
    return contexts.slice(0, limit);
  }

  async getTotalTokens(): Promise<number> {
    const contexts = await this.getAllContexts();
    return contexts.reduce((sum, ctx) => sum + ctx.token_count, 0);
  }

  async clearAllContexts(): Promise<void> {
    await fs.writeFile(this.contextsFile, JSON.stringify([], null, 2));
  }
}
