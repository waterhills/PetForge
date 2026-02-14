import { createLogger } from './logger.js';

const logger = createLogger('errors');

/**
 * Custom Application Error class
 * Use for operational errors that should be handled gracefully
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Flag to distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 * Should be used as the last error handler in server.js
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  logger.error('Error caught by error handler', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
  });

  // Handle operational errors (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Handle Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        // Record not found
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
      case 'P2003':
        // Unique constraint violation
        return res.status(400).json({
          success: false,
          error: 'Resource already exists',
        });
      case 'P2025':
        // Foreign key constraint violation
        return res.status(400).json({
          success: false,
          error: 'Invalid reference to related resource',
        });
      default:
        // Other Prisma errors
        return res.status(500).json({
          success: false,
          error: 'Database error',
        });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors,
    });
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds maximum limit',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field',
    });
  }

  // Default error response for unexpected errors
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`,
  });
};
