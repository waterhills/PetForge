import crypto from 'crypto';

/**
 * 生成 CSRF Token
 * @returns {string} Base64 编码的随机 token
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('base64');
};

/**
 * CSRF 保护中间件
 * 为状态改变的操作（POST/PUT/PATCH/DELETE）验证 CSRF token
 * 豁免登录和注册端点
 */
export const csrfProtection = (req, res, next) => {
  // 跳过 GET/HEAD/OPTIONS 请求（只读操作）
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 豁免登录和注册端点（用户还没有 CSRF token）
  // 豁免上传端点（用于图像上传，在认证前后的流程中都可能使用）
  // req.path 在 Express 中返回路由挂载点后的路径
  const exemptPaths = ['/login', '/register', '/auth/login', '/auth/register', '/upload', '/upload-image', '/upload/'];
  if (exemptPaths.includes(req.path)) {
    console.log(`[CSRF] Skipping CSRF check for public endpoint: ${req.path}`);
    return next();
  }

  let csrfToken = req.headers['x-csrf-token'];
  const sessionCSRFToken = req.cookies?.csrf_token;

  // URL-decode the header token (HTTP headers may URL-encode characters like +)
  if (csrfToken) {
    try {
      csrfToken = decodeURIComponent(csrfToken);
    } catch (e) {
      console.warn('[CSRF] Failed to decode header token:', e.message);
    }
  }

  // Detailed logging
  console.log(`[CSRF] Validating ${req.method} ${req.path}`);
  console.log(`[CSRF] Header token: ${csrfToken ? csrfToken.substring(0, 20) + '...' : 'MISSING'}`);
  console.log(`[CSRF] Cookie token: ${sessionCSRFToken ? sessionCSRFToken.substring(0, 20) + '...' : 'MISSING'}`);

  if (!csrfToken || !sessionCSRFToken || csrfToken !== sessionCSRFToken) {
    console.log(`[CSRF] ❌ Validation failed for ${req.path}`);
    console.log(`[CSRF] - Header present: ${!!csrfToken}`);
    console.log(`[CSRF] - Cookie present: ${!!sessionCSRFToken}`);
    console.log(`[CSRF] - Tokens match: ${csrfToken === sessionCSRFToken}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
  }

  console.log(`[CSRF] ✅ Validation passed for ${req.path}`);
  next();
};

/**
 * 设置 CSRF Token 的中间件
 * 只在没有现有 token 时生成新 token，避免覆盖现有 token
 */
export const setCSRFToken = (req, res, next) => {
  // 只在没有现有 CSRF token 时生成新的
  const existingToken = req.cookies?.csrf_token;

  if (!existingToken) {
    const csrfToken = generateCSRFToken();

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false, // 允许 JavaScript 读取（前端需要发送）
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 小时
      path: '/',
    });

    // 将 CSRF token 添加到响应头，方便前端获取
    res.setHeader('X-CSRF-Token', csrfToken);

    console.log('[CSRF] Generated new token');
  } else {
    // 即使有现有 token，也将其添加到响应头（确保前端能获取）
    res.setHeader('X-CSRF-Token', existingToken);
  }

  next();
};
