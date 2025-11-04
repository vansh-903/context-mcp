/**
 * Storage interface that both JsonStorage and SqliteStorage implement
 */

import { Session, ContextEntry } from '../types';

export type { Session, ContextEntry };

export interface IStorage {
  initialize(): Promise<void>;
  getSession(): Promise<Session>;
  saveSession(session: Session): Promise<void>;
  getAllContexts(): Promise<ContextEntry[]>;
  getContextById(id: string): Promise<ContextEntry | null>;
  addContext(entry: Omit<ContextEntry, 'id' | 'created_at'>): Promise<ContextEntry>;
  updateContext(id: string, updates: Partial<ContextEntry>): Promise<ContextEntry | null>;
  deleteContext(id: string): Promise<boolean>;
  searchContexts(query: string, limit?: number): Promise<ContextEntry[]>;
  getRecentContexts(limit?: number): Promise<ContextEntry[]>;
  getTotalTokens(): Promise<number>;
  clearAllContexts(): Promise<void>;
}
