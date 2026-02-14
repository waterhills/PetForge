import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID middleware
 * Adds a unique ID to each request for tracing and debugging
 * Reads X-Request-ID header or generates a new UUID
 */
export const requestId = (req, res, next) => {
  // Read request ID from header or generate new one
  req.id = req.headers['x-request-id'] || uuidv4();

  // Add request ID to response header for client-side tracing
  res.setHeader('X-Request-ID', req.id);

  next();
};

/**
 * Attach request ID to logger context
 * Use this in routes to include request ID in logs
 */
export const logWithRequestId = (logger, req) => {
  return {
    ...req,
    requestId: req.id,
  };
};
