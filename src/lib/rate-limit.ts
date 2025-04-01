interface RateLimitOptions {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimit {
  private store: RateLimitStore = {};
  private interval: number;
  private uniqueTokenPerInterval: number;

  constructor(options: RateLimitOptions) {
    this.interval = options.interval;
    this.uniqueTokenPerInterval = options.uniqueTokenPerInterval;
  }

  async check(limit: number, token: string): Promise<void> {
    const now = Date.now();
    const key = `${token}`;

    // Initialize or get existing entry
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.interval
      };
    }

    // Reset if interval has passed
    if (now > this.store[key].resetTime) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.interval
      };
    }

    // Increment count
    this.store[key].count++;

    // Check if limit exceeded
    if (this.store[key].count > limit) {
      throw new Error('Rate limit exceeded');
    }

    // Clean up old entries if store is too large
    if (Object.keys(this.store).length > this.uniqueTokenPerInterval) {
      const keys = Object.keys(this.store);
      for (const k of keys) {
        if (now > this.store[k].resetTime) {
          delete this.store[k];
        }
      }
    }
  }
}

export function rateLimit(options: RateLimitOptions): RateLimit {
  return new RateLimit(options);
} 