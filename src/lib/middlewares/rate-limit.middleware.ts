import * as http from "http";
import { IMiddleware } from "../common/interfaces";

/**
 * Rate limiting middleware.
 * Limits requests per IP address to prevent abuse.
 * Stores request counts in memory (suitable for single-instance servers).
 * For distributed systems, use Redis instead.
 *
 * Configuration:
 * - Window: 15 minutes
 * - Max requests: 100 per window
 *
 * Returns 429 (Too Many Requests) when limit exceeded.
 */
export class RateLimitMiddleware implements IMiddleware {
  /** In-memory storage of request counts per IP address */
  private clients = new Map<string, { count: number; resetTime: number }>();

  /** Rate limit window: 15 minutes */
  private readonly WINDOW_MS = 15 * 60 * 1000;

  /** Max requests allowed per window: 100 */
  private readonly MAX_REQUESTS = 100;

  /**
   * Check rate limit and block if exceeded.
   * Uses client IP address to track requests.
   */
  use(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) {
    const ip = req.socket.remoteAddress || "unknown";
    const now = Date.now();

    if (!this.clients.has(ip)) {
      // First request from this IP
      this.clients.set(ip, { count: 1, resetTime: now + this.WINDOW_MS });
    } else {
      const data = this.clients.get(ip)!;

      // Reset window if expired
      if (now > data.resetTime) {
        data.count = 1;
        data.resetTime = now + this.WINDOW_MS;
      } else {
        data.count++;
      }

      // Block if limit exceeded
      if (data.count > this.MAX_REQUESTS) {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            statusCode: 429,
            error: "Too Many Requests",
            message: `Retry after ${Math.round((data.resetTime - now) / 1000)}s`,
          }),
        );
        return;
      }
    }

    // Add rate limit headers to response for client information
    const clientData = this.clients.get(ip)!;
    res.setHeader("X-RateLimit-Limit", this.MAX_REQUESTS);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, this.MAX_REQUESTS - clientData.count),
    );

    next();
  }
}
