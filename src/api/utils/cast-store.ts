// Simple in-memory store for cast data
// In production, you'd want to use Redis or a database

interface StoredCastData {
  hash: string;
  text: string;
  author: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
  };
  media: {
    isValid: boolean;
    mediaUrl?: string;
    error?: string;
  };
  timestamp: string;
  tgcParams?: any;
  createdAt: Date;
}

class CastStore {
  private store = new Map<string, StoredCastData>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Store cast data
  storeCast(castData: Omit<StoredCastData, 'createdAt'>): void {
    this.store.set(castData.hash, {
      ...castData,
      createdAt: new Date()
    });

    // Clean up old entries periodically
    this.cleanup();
  }

  // Retrieve cast data
  getCast(castHash: string): StoredCastData | null {
    const data = this.store.get(castHash);
    
    if (!data) {
      return null;
    }

    // Check if data is expired
    const now = new Date();
    const ageMs = now.getTime() - data.createdAt.getTime();
    
    if (ageMs > this.TTL) {
      this.store.delete(castHash);
      return null;
    }

    return data;
  }

  // Update TGC parameters for a stored cast
  updateTGCParams(castHash: string, tgcParams: any): boolean {
    const data = this.store.get(castHash);
    
    if (!data) {
      return false;
    }

    data.tgcParams = tgcParams;
    this.store.set(castHash, data);
    return true;
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, data] of this.store.entries()) {
      const ageMs = now.getTime() - data.createdAt.getTime();
      if (ageMs > this.TTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.store.delete(key));
  }

  // Get store stats (for debugging)
  getStats() {
    return {
      totalEntries: this.store.size,
      entries: Array.from(this.store.keys())
    };
  }
}

// Export singleton instance
export const castStore = new CastStore();
export type { StoredCastData };