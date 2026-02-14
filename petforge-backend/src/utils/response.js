/**
 * Standardized API response utilities
 * Ensures consistent response format across all endpoints
 */

/**
 * Success response (200)
 * @param {Response} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {object} meta - Optional metadata (pagination, etc.)
 */
export const success = (res, data, message, meta = {}) => {
  const responseBody = {
    success: true,
    data,
  };

  if (message) {
    responseBody.message = message;
  }

  if (Object.keys(meta).length > 0) {
    responseBody.meta = meta;
  }

  return res.status(200).json(responseBody);
};

/**
 * Created response (201)
 * @param {Response} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Optional message
 */
export const created = (res, data, message) => {
  const responseBody = {
    success: true,
    data,
  };

  if (message) {
    responseBody.message = message;
  }

  return res.status(201).json(responseBody);
};

/**
 * No content response (204)
 * @param {Response} res - Express response object
 */
export const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Bad request response (400)
 * @param {Response} res - Express response object
 * @param {string|Error} error - Error message or Error object
 */
export const badRequest = (res, error) => {
  return res.status(400).json({
    success: false,
    error: typeof error === 'string' ? error : error.message || 'Invalid request',
  });
};

/**
 * Unauthorized response (401)
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 */
export const unauthorized = (res, message = 'Authentication required') => {
  return res.status(401).json({
    success: false,
    error: message,
  });
};

/**
 * Forbidden response (403)
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 */
export const forbidden = (res, message = 'Insufficient permissions') => {
  return res.status(403).json({
    success: false,
    error: message,
  });
};

/**
 * Not found response (404)
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 */
export const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    error: message,
  });
};

/**
 * Conflict response (409)
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 */
export const conflict = (res, message = 'Resource conflict') => {
  return res.status(409).json({
    success: false,
    error: message,
  });
};

/**
 * Too many requests response (429)
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 */
export const tooManyRequests = (res, message = 'Too many requests, please try again later') => {
  return res.status(429).json({
    success: false,
    error: message,
  });
};

/**
 * Internal server error response (500)
 * @param {Response} res - Express response object
 * @param {string} error - Error message
 */
export const serverError = (res, error = 'Internal server error') => {
  return res.status(500).json({
    success: false,
    error,
  });
};

/**
 * Service unavailable response (503)
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 */
export const serviceUnavailable = (res, message = 'Service temporarily unavailable') => {
  return res.status(503).json({
    success: false,
    error: message,
  });
};

/**
 * Paginated response helper
 * @param {Response} res - Express response object
 * @param {Array} data - Array of items
 * @param {object} pagination - Pagination metadata
 * @param {string} message - Optional message
 */
export const paginated = (res, data, pagination, message) => {
  return success(res, data, message, {
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: pagination.total || 0,
      totalPages: Math.ceil(pagination.total / pagination.limit) || 1,
      ...pagination,
    },
  });
};
