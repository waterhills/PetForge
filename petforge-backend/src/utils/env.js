/**
 * 环境变量校验工具
 * 在服务器启动前确保所有必需的环境变量存在
 */

export const validateEnv = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'COMFYUI_URL',
    'PORT',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  // 对不安全的默认值发出警告
  if (process.env.JWT_SECRET === 'CHANGE_THIS_GENERATE_STRONG_SECRET_32_CHARS') {
    console.warn(
      `⚠️  Using default JWT_SECRET. Please generate a strong secret with:\n   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }

  if (
    process.env.DATABASE_URL.includes('CHANGE_THIS_PASSWORD') ||
    process.env.DATABASE_URL.includes('petforge123')
  ) {
    console.warn(
      '⚠️  Using default database password. Please change it in production!'
    );
  }

  // 生产环境专用检查
  if (process.env.NODE_ENV === 'production') {
    const productionRequired = ['FRONTEND_URL', 'CORS_ORIGIN'];
    const missingProduction = productionRequired.filter((key) => !process.env[key]);

    if (missingProduction.length > 0) {
      console.warn(
        `⚠️  Production environment missing recommended variables: ${missingProduction.join(', ')}`
      );
    }

    // 检查 JWT 密钥强度
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error(
        '❌ JWT_SECRET must be at least 32 characters in production'
      );
    }
  }

  console.log('✅ Environment variables validated successfully');
};

/**
 * 获取环境变量，不存在时返回默认值
 * @param {string} key - 环境变量名
 * @param {*} defaultValue - 默认值
 * @returns {*} 环境变量值或默认值
 */
export const getEnv = (key, defaultValue = undefined) => {
  return process.env[key] !== undefined
    ? process.env[key]
    : defaultValue;
};

/**
 * 获取布尔类型的环境变量
 * @param {string} key - 环境变量名
 * @param {boolean} defaultValue - 默认值
 * @returns {boolean} 布尔值
 */
export const getEnvBoolean = (key, defaultValue = false) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
};

/**
 * 获取数字类型的环境变量
 * @param {string} key - 环境变量名
 * @param {number} defaultValue - 默认值
 * @returns {number} 数字值
 */
export const getEnvNumber = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    console.warn(
      `⚠️  Environment variable ${key} is not a number, using default: ${defaultValue}`
    );
    return defaultValue;
  }
  return num;
};
