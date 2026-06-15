// Simple in-memory TTL cache

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export const cache = {
  get(key: string): any | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.data;
  },

  set(key: string, data: any, ttlSeconds: number): void {
    store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  del(key: string): void {
    store.delete(key);
  },

  clear(): void {
    store.clear();
  },
};
