import { useEffect, useRef, useState, useCallback } from 'react';

export interface GenerationUpdate {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;        // 0-100
  preview?: string;       // Base64 image preview
  error?: string;
  message?: string;
  timestamp: string;
}

export interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  error: string | null;
}

export interface GenerationProgressHook {
  status: WebSocketStatus;
  updates: GenerationUpdate[];
  isConnected: boolean;
  connect: (taskId: string, token: string) => void;
  disconnect: () => void;
  subscribe: (taskId: string) => void;
  unsubscribe: (taskId: string) => void;
  clearUpdates: () => void;
}

const WS_RECONNECT_DELAY = 2000;
const WS_TIMEOUT = 10000;

export function useGenerationProgress(): GenerationProgressHook {
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    connecting: false,
    reconnecting: false,
    error: null,
  });

  const [updates, setUpdates] = useState<GenerationUpdate[]>([]);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const taskSubscriptionsRef = useRef<Set<string>>(new Set());
  const connectionRetryCount = useRef(0);
  const maxRetries = 5;

  // 清理连接
  const cleanupConnection = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    connectionRetryCount.current = 0;
  }, []);

  // 建立 WebSocket 连接
  const connect = useCallback((taskId: string, token: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // 如果已经连接，直接订阅
      subscribe(taskId);
      return;
    }

    cleanupConnection();

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'}ws/generation?token=${token}&taskId=${taskId}`;

    setStatus(prev => ({
      ...prev,
      connecting: true,
      reconnecting: connectionRetryCount.current > 0,
      error: null,
    }));

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setStatus(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          reconnecting: false,
          error: null,
        }));
        connectionRetryCount.current = 0;

        // 自动订阅当前任务
        if (taskId) {
          subscribe(taskId);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventType, data } = message;

          // 处理不同类型的事件
          switch (eventType) {
            case 'connected':
              console.log('[WebSocket] Connection established:', data);
              break;

            case 'progress_update':
              setUpdates(prev => {
                // 查找是否已有该任务更新
                const existingIndex = prev.findIndex(u => u.taskId === data.taskId);
                const update = { ...data, timestamp: new Date().toISOString() };

                if (existingIndex >= 0) {
                  const newUpdates = [...prev];
                  newUpdates[existingIndex] = update;
                  return newUpdates;
                }
                return [...prev, update];
              });
              break;

            case 'status_change':
              setUpdates(prev => {
                const existingIndex = prev.findIndex(u => u.taskId === data.taskId);
                const update = {
                  ...data,
                  timestamp: new Date().toISOString(),
                };

                if (existingIndex >= 0) {
                  const newUpdates = [...prev];
                  newUpdates[existingIndex] = update;
                  return newUpdates;
                }
                return [...prev, update];
              });
              break;

            case 'error':
              console.error('[WebSocket] Error:', data);
              setStatus(prev => ({
                ...prev,
                error: data.message,
              }));
              break;
          }
        } catch (error) {
          console.error('[WebSocket] Message parsing error:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
        }));

        // 尝试重连
        if (connectionRetryCount.current < maxRetries) {
          connectionRetryCount.current++;
          setTimeout(() => {
            connect(taskId, token);
          }, WS_RECONNECT_DELAY * connectionRetryCount.current);
        } else {
          setStatus(prev => ({
            ...prev,
            error: 'Connection lost. Maximum retry attempts reached.',
          }));
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: 'Connection failed',
        }));
      };

      // 设置连接超时
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          cleanupConnection();
          setStatus(prev => ({
            ...prev,
            connected: false,
            connecting: false,
            error: 'Connection timeout',
          }));
        }
      }, WS_TIMEOUT);

    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      cleanupConnection();
      setStatus(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: 'Connection failed',
      }));
    }
  }, [cleanupConnection]);

  // 订阅任务
  const subscribe = useCallback((taskId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] WebSocket not connected');
      return;
    }

    taskSubscriptionsRef.current.add(taskId);
    setSubscriptions(prev => new Set([...prev, taskId]));

    // 发送订阅消息
    wsRef.current.send(JSON.stringify({
      event: 'subscribe',
      data: { taskId },
    }));

    console.log(`[WebSocket] Subscribed to task: ${taskId}`);
  }, []);

  // 取消订阅任务
  const unsubscribe = useCallback((taskId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] WebSocket not connected');
      return;
    }

    taskSubscriptionsRef.current.delete(taskId);
    setSubscriptions(prev => {
      const newSubscriptions = new Set(prev);
      newSubscriptions.delete(taskId);
      return newSubscriptions;
    });

    // 发送取消订阅消息
    wsRef.current.send(JSON.stringify({
      event: 'unsubscribe',
      data: { taskId },
    }));

    console.log(`[WebSocket] Unsubscribed from task: ${taskId}`);
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    cleanupConnection();
    setSubscriptions(new Set());
    setUpdates([]);
    console.log('[WebSocket] Disconnected');
  }, [cleanupConnection]);

  // 清除更新
  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  // 自动处理心跳
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          event: 'ping',
          data: {},
        }));
      }
    }, 30000); // 30秒发送一次心跳

    return () => clearInterval(interval);
  }, []);

  // 清理组件卸载
  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  return {
    status,
    updates,
    isConnected: status.connected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearUpdates,
  };
}