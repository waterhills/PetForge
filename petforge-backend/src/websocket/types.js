// WebSocket 相关类型定义

export const WebSocketEvents = {
  // 客户端发送的事件
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PING: 'ping',

  // 服务器推送的事件
  PROGRESS_UPDATE: 'progress_update',
  STATUS_CHANGE: 'status_change',
  ERROR: 'error',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

// 生成进度更新数据结构
export class GenerationUpdate {
  constructor({
    taskId,
    status = 'pending',
    progress = 0,
    preview = null,
    error = null,
    message = '',
  }) {
    if (!taskId) {
      throw new Error('Task ID is required');
    }

    this.taskId = taskId;
    this.status = status;
    this.progress = progress;
    this.preview = preview;
    this.error = error;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      taskId: this.taskId,
      status: this.status,
      progress: this.progress,
      preview: this.preview,
      error: this.error,
      message: this.message,
      timestamp: this.timestamp,
    };
  }
}

// WebSocket 消息结构
export class WebSocketMessage {
  constructor(event, data, metadata = {}) {
    this.event = event;
    this.data = data;
    this.metadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
    };
  }

  toJSON() {
    return {
      event: this.event,
      data: this.data,
      metadata: this.metadata,
    };
  }
}