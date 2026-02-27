import type { SessionInfo } from "./types.js";

/**
 * Session storage interface for custom implementations
 */
export interface SessionStorage {
  save(session: SessionInfo): Promise<void>;
  get(id: string): Promise<SessionInfo | null>;
  list(): Promise<SessionInfo[]>;
  delete(id: string): Promise<void>;
}

/**
 * In-memory session storage (for development/testing)
 */
export class InMemorySessionStorage implements SessionStorage {
  private sessions = new Map<string, SessionInfo>();

  async save(session: SessionInfo): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async get(id: string): Promise<SessionInfo | null> {
    return this.sessions.get(id) ?? null;
  }

  async list(): Promise<SessionInfo[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
    );
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  clear(): void {
    this.sessions.clear();
  }
}

/**
 * Session manager for tracking and resuming agent sessions
 */
export class SessionManager {
  private storage: SessionStorage;

  constructor(storage?: SessionStorage) {
    this.storage = storage ?? new InMemorySessionStorage();
  }

  /**
   * Create a new session entry
   */
  async createSession(id: string, name?: string): Promise<SessionInfo> {
    const now = new Date();
    const session: SessionInfo = {
      id,
      createdAt: now,
      lastActivityAt: now,
      name,
    };
    await this.storage.save(session);
    return session;
  }

  /**
   * Update session activity timestamp
   */
  async touchSession(id: string): Promise<void> {
    const session = await this.storage.get(id);
    if (session) {
      session.lastActivityAt = new Date();
      await this.storage.save(session);
    }
  }

  /**
   * Get a session by ID
   */
  async getSession(id: string): Promise<SessionInfo | null> {
    return this.storage.get(id);
  }

  /**
   * List all sessions, sorted by most recent activity
   */
  async listSessions(): Promise<SessionInfo[]> {
    return this.storage.list();
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  /**
   * Check if a session exists
   */
  async hasSession(id: string): Promise<boolean> {
    const session = await this.storage.get(id);
    return session !== null;
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Create a session manager with default in-memory storage
 */
export function createSessionManager(
  storage?: SessionStorage
): SessionManager {
  return new SessionManager(storage);
}
