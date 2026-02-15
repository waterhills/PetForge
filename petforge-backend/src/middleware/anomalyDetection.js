import prisma from '../config/database.js';

/**
 * 检测异常登录行为
 * @param {string} userId - 用户 ID
 * @param {Object} req - Express 请求对象
 * @returns {Object} { anomalous: boolean, reasons: string[], previousData: Object }
 */
export const detectAnomalousLogin = async (userId, req) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastLoginIp: true,
      lastLoginAt: true,
      lastLoginUserAgent: true,
    }
  });

  if (!user) {
    return { anomalous: false, reasons: [] };
  }

  const reasons = [];
  const currentIp = req.ip || req.connection.remoteAddress || '';
  const currentUserAgent = req.headers['user-agent'] || '';

  // 检测 1: IP 地址变化
  if (user.lastLoginIp && user.lastLoginIp !== currentIp) {
    reasons.push('IP address changed');
  }

  // 检测 2: User-Agent 变化
  if (user.lastLoginUserAgent && user.lastLoginUserAgent !== currentUserAgent) {
    reasons.push('Browser or device changed');
  }

  // 检测 3: 异常时间（凌晨 2-6 点登录）
  const currentHour = new Date().getHours();
  if (currentHour >= 2 && currentHour <= 6) {
    reasons.push('Unusual login time');
  }

  return {
    anomalous: reasons.length > 0,
    reasons,
    previousData: {
      ip: user.lastLoginIp,
      userAgent: user.lastLoginUserAgent,
      time: user.lastLoginAt,
    }
  };
};

/**
 * 记录登录信息
 * @param {string} userId - 用户 ID
 * @param {Object} req - Express 请求对象
 */
export const recordLogin = async (userId, req) => {
  const currentIp = req.ip || req.connection.remoteAddress || '';
  const currentUserAgent = req.headers['user-agent'] || '';

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginIp: currentIp,
      lastLoginUserAgent: currentUserAgent,
      lastLoginAt: new Date(),
    }
  });
};
