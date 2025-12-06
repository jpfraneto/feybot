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
  feyTokenParams?: any;
  intentType?: 'tgc' | 'fey_token' | 'none';
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
    data.intentType = 'tgc';
    this.store.set(castHash, data);
    return true;
  }

  // Update FEY token parameters for a stored cast
  updateFeyTokenParams(castHash: string, feyTokenParams: any): boolean {
    const data = this.store.get(castHash);
    
    if (!data) {
      return false;
    }

    data.feyTokenParams = feyTokenParams;
    data.intentType = 'fey_token';
    this.store.set(castHash, data);
    return true;
  }

  // Update intent type for a stored cast
  updateIntentType(castHash: string, intentType: 'tgc' | 'fey_token' | 'none'): boolean {
    const data = this.store.get(castHash);
    
    if (!data) {
      return false;
    }

    data.intentType = intentType;
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