/**
 * In-memory rate limiter for protecting sensitive endpoints (e.g., admin login).
 * No external dependencies (no Redis required).
 * Tracks attempts per IP address with configurable window and max attempts.
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      store.delete(key);
    } else if (now - entry.firstAttempt > 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function rateLimiter({
  windowMs = 15 * 60 * 1000,   // 15 minutes
  maxAttempts = 5,              // 5 attempts per window
  blockDurationMs = 30 * 60 * 1000, // Block for 30 minutes after exceeding
  keyPrefix = 'rl'
}: {
  windowMs?: number;
  maxAttempts?: number;
  blockDurationMs?: number;
  keyPrefix?: string;
} = {}) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = store.get(key);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const retryAfterSec = Math.ceil((entry.blockedUntil - now) / 1000);
      return res.status(429).json({
        error: `Too many attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
        retryAfter: retryAfterSec
      });
    }

    // Check if window has expired
    if (!entry || (now - entry.firstAttempt > windowMs)) {
      store.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    // Increment count
    entry.count++;

    // Check if max attempts exceeded
    if (entry.count > maxAttempts) {
      entry.blockedUntil = now + blockDurationMs;
      store.set(key, entry);
      return res.status(429).json({
        error: `Too many login attempts. You are blocked for ${Math.ceil(blockDurationMs / 60000)} minutes.`,
        retryAfter: Math.ceil(blockDurationMs / 1000)
      });
    }

    store.set(key, entry);
    next();
  };
}

/**
 * Reset the rate limit for a given IP (call on successful login)
 */
export function resetRateLimit(ip: string, keyPrefix = 'rl') {
  store.delete(`${keyPrefix}:${ip}`);
}
