import type { SessionState, SessionStore } from "./types.js";

/**
 * In-memory session store implementation
 */
export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionState>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private ttlMs: number = 30 * 60 * 1000) {}

  get(id: string): SessionState | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivityAt = new Date();
    }
    return session;
  }

  set(id: string, session: SessionState): void {
    this.sessions.set(id, session);
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  has(id: string): boolean {
    return this.sessions.has(id);
  }

  keys(): IterableIterator<string> {
    return this.sessions.keys();
  }

  get size(): number {
    return this.sessions.size;
  }

  /**
   * Start automatic cleanup of expired sessions
   */
  startCleanup(intervalMs: number = 60000): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, intervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove expired sessions
   */
  cleanupExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, session] of this.sessions) {
      const age = now - session.lastActivityAt.getTime();
      if (age > this.ttlMs) {
        this.sessions.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
  }
}

/**
 * Create a new session store with the specified TTL
 */
export function createSessionStore(ttlMs?: number): InMemorySessionStore {
  return new InMemorySessionStore(ttlMs);
}
