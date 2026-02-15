import crypto from 'crypto';

/**
 * 生成设备 ID
 * 基于 User-Agent、Accept-Language 和 IP 地址
 * @param {Object} req - Express 请求对象
 * @returns {string} SHA256 哈希的设备指纹
 */
export const generateDeviceId = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const ip = req.ip || req.connection.remoteAddress || '';

  const fingerprint = `${userAgent}-${acceptLanguage}-${ip}`;

  return crypto
    .createHash('sha256')
    .update(fingerprint)
    .digest('hex');
};

/**
 * 验证设备指纹
 * @param {Object} user - 用户对象
 * @param {string} deviceId - 当前设备 ID
 * @returns {Object} { valid: boolean, isNewDevice: boolean }
 */
export const verifyDeviceFingerprint = (user, deviceId) => {
  // 如果是首次登录，记录设备指纹
  if (!user.deviceFingerprint) {
    return { valid: true, isNewDevice: true };
  }

  // 检查设备指纹是否匹配
  if (user.deviceFingerprint !== deviceId) {
    return { valid: false, isNewDevice: false };
  }

  return { valid: true, isNewDevice: false };
};

/**
 * 设备指纹中间件
 * 为每个请求生成设备 ID 并附加到 req 对象
 */
export const deviceFingerprint = async (req, res, next) => {
  const deviceId = generateDeviceId(req);

  req.deviceId = deviceId;
  next();
};
