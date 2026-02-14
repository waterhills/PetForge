import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticateToken = async (req, res, next) => {
  // Try to get token from Authorization header first
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader) {
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  // Fallback to cookie if no token in header
  if (!token && req.cookies) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Fetch user with role and permissions
    try {
      const userWithRole = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      resource: true,
                      action: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userWithRole) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Attach extended user info to request
      req.user = {
        ...user,
        roleId: userWithRole.roleId,
        roleName: userWithRole.role?.name || 'user',
        permissions: userWithRole.role?.permissions?.map(rp => rp.permission) || [],
      };
      req.userId = user.userId;
      next();
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Continue with basic user info if role fetch fails
      req.user = user;
      req.userId = user.userId;
      next();
    }
  });
};

export const optionalAuth = async (req, res, next) => {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader) {
    token = authHeader && authHeader.split(' ')[1];
  }

  // Fallback to cookie
  if (!token && req.cookies) {
    token = req.cookies.auth_token;
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (!err) {
        try {
          const userWithRole = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
              id: true,
              roleId: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  permissions: {
                    select: {
                      permission: {
                        select: {
                          code: true,
                          resource: true,
                          action: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          if (userWithRole) {
            req.user = {
              ...user,
              roleId: userWithRole.roleId,
              roleName: userWithRole.role?.name || 'user',
              permissions: userWithRole.role?.permissions?.map(rp => rp.permission) || [],
            };
            req.userId = user.userId;
          } else {
            req.user = user;
            req.userId = user.userId;
          }
        } catch (error) {
          req.user = user;
          req.userId = user.userId;
        }
      }
    });
  }

  next();
};

/**
 * Role-based authorization middleware
 * Requires user to have one of the specified role names
 * @param  {...string} allowedRoles - Array of allowed role names
 * @returns {Function} Express middleware function
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userRole = req.user.roleName || req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
};
