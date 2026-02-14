import rateLimit from 'express-rate-limit';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * General rate limiter for all API endpoints
 * Development: 1000 requests per 15 minutes
 * Production: 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Much higher limit in development
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  skip: (req) => {
    // Skip rate limiting for admin routes in development
    return isDevelopment && req.path.startsWith('/api/admin');
  },
});

/**
 * Rate limiter for admin endpoints
 * Development: Disabled (no limit)
 * Production: 200 requests per 15 minutes
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 0 : 200, // 0 = disabled in development
  message: {
    success: false,
    error: 'Too many admin requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevelopment, // Completely skip in development
});

/**
 * Stricter rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 * Helps prevent brute force attacks on login/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5, // Higher limit in development
  skipSuccessfulRequests: true, // Don't count successful requests (allow legitimate logins)
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for payment endpoints
 * Development: 100 requests per 15 minutes
 * Production: 10 requests per 15 minutes
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : 10,
  message: {
    success: false,
    error: 'Too many payment attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file uploads
 * Development: 100 uploads per 15 minutes
 * Production: 20 uploads per 15 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : 20,
  message: {
    success: false,
    error: 'Too many upload attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
