'use client';

import { useEffect, useState } from 'react';
import { useGenerationProgress, GenerationUpdate } from '../hooks/useGenerationProgress';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface GenerationProgressProps {
  taskId: string;
  authToken: string;
  onComplete?: (update: GenerationUpdate) => void;
  onError?: (error: string) => void;
}

export function GenerationProgress({
  taskId,
  authToken,
  onComplete,
  onError
}: GenerationProgressProps) {
  const { status, updates, isConnected, connect, disconnect, clearUpdates } = useGenerationProgress();

  const latestUpdate = updates.find(u => u.taskId === taskId);
  const update = latestUpdate || {
    taskId,
    status: 'pending' as const,
    progress: 0,
    timestamp: new Date().toISOString(),
  };

  // 连接到 WebSocket
  useEffect(() => {
    if (taskId && authToken && !isConnected) {
      connect(taskId, authToken);
    }
  }, [taskId, authToken, isConnected, connect]);

  // 处理更新
  useEffect(() => {
    if (update.status === 'completed' && onComplete) {
      onComplete(update);
    }
    if (update.status === 'failed' && onError && update.error) {
      onError(update.error);
    }
  }, [update, onComplete, onError]);

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '等待生成';
      case 'processing':
        return '生成中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '生成失败';
      default:
        return status;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // 渲染进度条
  const renderProgressBar = () => {
    const percentage = update.progress;

    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            update.status === 'processing' ? 'bg-blue-600 animate-pulse' :
            update.status === 'completed' ? 'bg-green-600' :
            update.status === 'failed' ? 'bg-red-600' : 'bg-gray-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  // 渲染进度信息
  const renderProgressInfo = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">状态</span>
          <span className={`text-sm font-bold ${getStatusColor(update.status)}`}>
            {getStatusText(update.status)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">进度</span>
          <span className="text-sm font-bold">{Math.round(update.progress)}%</span>
        </div>

        {update.message && (
          <div className="text-sm text-gray-600">
            {update.message}
          </div>
        )}

        {update.error && (
          <div className="text-sm text-red-600">
            错误：{update.error}
          </div>
        )}

        {update.preview && (
          <div className="mt-4">
            <img
              src={update.preview}
              alt="Preview"
              className="w-full max-w-md rounded-lg border"
            />
          </div>
        )}

        {update.status === 'completed' && update.resultUrl && (
          <div className="mt-4">
            <a
              href={update.resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              查看生成的图像 →
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>生成进度</span>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="ml-1 text-xs">已连接</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
                <span className="ml-1 text-xs">未连接</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {renderProgressBar()}
        {renderProgressInfo()}

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearUpdates}
            disabled={update.status === 'completed' || update.status === 'failed'}
          >
            清除更新
          </Button>

          {update.status === 'processing' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={disconnect}
            >
              断开连接
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}