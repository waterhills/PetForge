import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateDeviceId } from './deviceFingerprint.js';

const prisma = new PrismaClient();

export const authenticateToken = async (req, res, next) => {
  // 1. 提取两种 token
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader ? authHeader.split(' ')[1] : null;
  const cookieToken = req.cookies?.auth_token || null;

  // 2. 拒绝：如果只存在一个
  if (!headerToken || !cookieToken) {
    // 清除可能存在的 cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    return res.status(401).json({
      success: false,
      error: 'Dual authentication required',
      code: 'DUAL_AUTH_MISSING'
    });
  }

  // 3. 验证两个 token
  let headerUser, cookieUser;

  try {
    headerUser = jwt.verify(headerToken, process.env.JWT_SECRET);
    cookieUser = jwt.verify(cookieToken, process.env.JWT_SECRET);
  } catch (err) {
    // 清除所有认证信息
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    return res.status(403).json({
      success: false,
      error: 'Invalid or expired tokens',
      code: 'DUAL_AUTH_INVALID'
    });
  }

  // 4. 拒绝：token 不匹配
  if (headerUser.userId !== cookieUser.userId ||
      headerUser.email !== cookieUser.email) {
    // 清除不匹配的 token
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    // 记录安全事件
    console.warn(`[SECURITY] Token mismatch from ${req.ip} - Header userId: ${headerUser.userId}, Cookie userId: ${cookieUser.userId}`);

    return res.status(403).json({
      success: false,
      error: 'Authentication tokens mismatch',
      code: 'DUAL_AUTH_MISMATCH'
    });
  }

  // 5. 验证设备指纹
  const expectedDeviceId = generateDeviceId(req);
  if (headerUser.deviceId && headerUser.deviceId !== expectedDeviceId) {
    console.warn(`[SECURITY] Device mismatch from ${req.ip} - Expected: ${expectedDeviceId}, Got: ${headerUser.deviceId}`);

    return res.status(403).json({
      success: false,
      error: 'Device verification failed',
      code: 'DEVICE_MISMATCH'
    });
  }

  // 6. 两者都有效且匹配 - 继续处理请求
  try {
    const userWithRole = await prisma.user.findUnique({
      where: { id: headerUser.userId },
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

    req.user = {
      ...headerUser,
      roleId: userWithRole.roleId,
      roleName: userWithRole.role?.name || 'user',
      permissions: userWithRole.role?.permissions?.map(rp => rp.permission) || [],
    };
    req.userId = headerUser.userId;
    next();
  } catch (error) {
    console.error('Error fetching user role:', error);
    req.user = headerUser;
    req.userId = headerUser.userId;
    next();
  }
};

export const optionalAuth = async (req, res, next) => {
  // 1. 提取两种 token
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader ? authHeader.split(' ')[1] : null;
  const cookieToken = req.cookies?.auth_token || null;

  // 2. 只有在两个 token 都存在时才进行验证
  if (headerToken && cookieToken) {
    try {
      // 验证两个 token
      const headerUser = await new Promise((resolve, reject) => {
        jwt.verify(headerToken, process.env.JWT_SECRET, (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      const cookieUser = await new Promise((resolve, reject) => {
        jwt.verify(cookieToken, process.env.JWT_SECRET, (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      // 验证 tokens 是否匹配
      if (headerUser.userId === cookieUser.userId &&
          headerUser.email === cookieUser.email) {

        // 验证设备指纹
        const expectedDeviceId = generateDeviceId(req);
        if (!headerUser.deviceId || headerUser.deviceId === expectedDeviceId) {
          // Fetch user with role and permissions
          const userWithRole = await prisma.user.findUnique({
            where: { id: headerUser.userId },
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
              ...headerUser,
              roleId: userWithRole.roleId,
              roleName: userWithRole.role?.name || 'user',
              permissions: userWithRole.role?.permissions?.map(rp => rp.permission) || [],
            };
            req.userId = headerUser.userId;
          } else {
            req.user = headerUser;
            req.userId = headerUser.userId;
          }
        }
      }
    } catch (error) {
      // Invalid token or fetch error, proceed as guest
      console.debug('Optional dual auth failed, proceeding as guest:', error.message);
    }
  }

  // 作为游客继续
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
