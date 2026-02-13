/**
 * 日志工具
 * 提供结构化日志记录功能
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 日志级别定义
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray'
};

// 添加颜色支持
winston.addColors(colors);

// 创建日志目录
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
  })
);

// 控制台格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// 创建日志传输器
const transports = [];

// 添加控制台传输器
transports.push(
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: consoleFormat
  })
);

// 添加文件传输器
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  })
);

transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  })
);

// 创建日志记录器
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'warn'),
  levels,
  format: logFormat,
  transports,
  exitOnError: false
});

// 创建带有上下文信息的日志记录器
export function createLogger(module) {
  return {
    /**
     * 记录信息日志
     */
    info: (message, meta = {}) => {
      logger.info(message, { ...meta, module });
    },

    /**
     * 记录警告日志
     */
    warn: (message, meta = {}) => {
      logger.warn(message, { ...meta, module });
    },

    /**
     * 记录错误日志
     */
    error: (message, error = null, meta = {}) => {
      const errorMeta = {
        ...meta,
        module,
        ...(error && {
          stack: error.stack,
          code: error.code,
          errno: error.errno,
          message: error.message
        })
      };

      logger.error(message, errorMeta);
    },

    /**
     * 记录 HTTP 请求日志
     */
    http: (message, meta = {}) => {
      logger.http(message, { ...meta, module });
    },

    /**
     * 记录调试日志
     */
    debug: (message, meta = {}) => {
      logger.debug(message, { ...meta, module });
    },

    /**
     * 记录性能日志
     */
    performance: (operation, duration, meta = {}) => {
      logger.info(`PERFORMANCE: ${operation} completed in ${duration}ms`, {
        ...meta,
        module,
        duration,
        operation
      });
    },

    /**
     * 记录 API 调用日志
     */
    api: (endpoint, method, status, duration, meta = {}) => {
      const logLevel = status >= 400 ? 'error' : 'info';
      logger[logLevel](`API ${method} ${endpoint} - ${status} (${duration}ms)`, {
        ...meta,
        module,
        endpoint,
        method,
        status,
        duration
      });
    },

    /**
     * 记录数据库操作日志
     */
    database: (operation, table, success, duration, meta = {}) => {
      const logLevel = success ? 'info' : 'error';
      logger[logLevel](`DB ${operation} ${table} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`, {
        ...meta,
        module,
        operation,
        table,
        success,
        duration
      });
    },

    /**
     * 记录安全相关日志
     */
    security: (event, severity, meta = {}) => {
      const logLevel = severity === 'critical' ? 'error' : 'warn';
      logger[logLevel](`SECURITY: ${event}`, {
        ...meta,
        module,
        event,
        severity,
        timestamp: new Date().toISOString()
      });
    },

    /**
     * 记录业务逻辑日志
     */
    business: (event, data, meta = {}) => {
      logger.info(`BUSINESS: ${event}`, {
        ...meta,
        module,
        event,
        data,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// 错误处理中间件
export const errorHandler = (err, req, res, next) => {
  const logger = createLogger('errorHandler');

  // 记录错误详情
  logger.error('Unhandled error occurred', err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  } else {
    // 生产环境返回简洁错误信息
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

// 404 处理
export const notFoundHandler = (req, res) => {
  const logger = createLogger('notFoundHandler');

  logger.warn(`Route not found: ${req.method} ${req.url}`, {
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
};

// 请求日志中间件
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logger = createLogger('requestLogger');

    logger.api(req.path, req.method, res.statusCode, duration, {
      contentLength: res.get('Content-Length'),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });

  next();
};

// 性能监控装饰器
export function monitorPerformance(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args) {
    const startTime = Date.now();
    const logger = createLogger('performance');

    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - startTime;

      logger.performance(`${target.constructor.name}.${propertyKey}`, duration, {
        args: args.length,
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.performance(`${target.constructor.name}.${propertyKey}`, duration, {
        args: args.length,
        success: false,
        error: error.message
      });

      throw error;
    }
  };

  return descriptor;
}

// 导出默认日志记录器
export default logger;