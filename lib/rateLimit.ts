// Simple in-memory rate limiter using a Map
// Note: In a serverless environment like Vercel, this memory is cleared across cold starts.
// For the free tier, this provides basic protection.

type RateLimitInfo = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitInfo>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15; // Max 15 requests per minute per IP/UserId

export function checkRateLimit(identifier: string): { success: boolean; message?: string } {
  const now = Date.now();
  const info = rateLimitMap.get(identifier);

  if (!info) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true };
  }

  if (now > info.resetTime) {
    // Window has passed, reset
    rateLimitMap.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true };
  }

  if (info.count >= MAX_REQUESTS) {
    return { success: false, message: 'Rate limit exceeded. Try again in a minute.' };
  }

  // Increment count
  info.count += 1;
  rateLimitMap.set(identifier, info);
  return { success: true };
}
