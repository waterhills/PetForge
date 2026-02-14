import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Permission-based authorization middleware
 * Checks if authenticated user has a specific permission
 * @param {string} permissionCode - Permission code to check (e.g., 'users.view', 'petips.delete')
 * @returns {Function} Express middleware function
 */
export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user has admin role (admins have all permissions)
    const userRole = req.user.roleName || req.user.role || 'user';
    if (userRole === 'admin') {
      return next();
    }

    // Check if user has the specific permission
    const userPermissions = req.user.permissions || [];
    const hasPermission = userPermissions.some(p => p.code === permissionCode);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Permission required: ${permissionCode}`,
      });
    }

    next();
  };
};

/**
 * Multiple permissions check (user must have at least one)
 * @param {...string} permissionCodes - Permission codes to check
 * @returns {Function} Express middleware function
 */
export const requireAnyPermission = (...permissionCodes) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user has admin role
    const userRole = req.user.roleName || req.user.role || 'user';
    if (userRole === 'admin') {
      return next();
    }

    // Check if user has at least one of the permissions
    const userPermissions = req.user.permissions || [];
    const hasAnyPermission = permissionCodes.some(code =>
      userPermissions.some(p => p.code === code)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        error: `One of these permissions required: ${permissionCodes.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Ownership-based authorization middleware
 * Checks if authenticated user owns the resource
 * @param {Function} getResourceOwnerId - Function that extracts owner ID from request
 * @returns {Function} Express middleware function
 *
 * Usage example:
 * router.patch('/petips/:id',
 *   authenticateToken,
 *   requireOwnership(req => req.params.id), // resourceId is in params
 *   updatePetIPHandler
 * );
 */
export const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if user has admin role
    const userRole = req.user.roleName || req.user.role || 'user';
    if (userRole === 'admin') {
      return next();
    }

    try {
      const resourceId = getResourceOwnerId(req);

      // Check if user owns the resource
      const resource = await prisma.user.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
      }

      if (resource.id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not own this resource',
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking resource ownership',
      });
    }
  };
};

/**
 * Check if user can perform action on resource based on permission
 * @param {string} resource - Resource type (e.g., 'users', 'petips', 'orders')
 * @param {string} action - Action type (e.g., 'view', 'create', 'edit', 'delete')
 * @returns {Function} Express middleware function
 */
export const can = (resource, action) => {
  const permissionCode = `${resource}.${action}`;
  return requirePermission(permissionCode);
};

/**
 * Helper to check if user has permission (for use in route handlers)
 * @param {object} user - User object from req.user
 * @param {string} permissionCode - Permission code to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permissionCode) => {
  if (!user) return false;

  const userRole = user.roleName || user.role || 'user';
  if (userRole === 'admin') return true;

  const userPermissions = user.permissions || [];
  return userPermissions.some(p => p.code === permissionCode);
};

/**
 * Helper to get all user permissions as a list of codes
 * @param {object} user - User object from req.user
 * @returns {string[]} Array of permission codes
 */
export const getUserPermissionCodes = (user) => {
  if (!user) return [];

  const userRole = user.roleName || user.role || 'user';
  if (userRole === 'admin') {
    // Admin has all permissions - you could fetch all permissions from DB
    return ['*']; // Special wildcard for all permissions
  }

  return (user.permissions || []).map(p => p.code);
};
