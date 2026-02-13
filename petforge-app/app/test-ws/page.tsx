'use client';

import { useState } from 'react';
import { GenerationProgress } from '@/components/GenerationProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGenerationProgress, GenerationUpdate } from '@/hooks/useGenerationProgress';

// 模拟生成任务
const mockTasks = [
  { id: 'task-001', status: 'pending', progress: 0 },
  { id: 'task-002', status: 'processing', progress: 45 },
  { id: 'task-003', status: 'completed', progress: 100 },
];

export default function WebSocketTestPage() {
  const [selectedTask, setSelectedTask] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const { clearUpdates } = useGenerationProgress();

  const handleSimulateProgress = async () => {
    if (!selectedTask || !authToken) {
      alert('请选择任务并输入认证令牌');
      return;
    }

    setIsSimulating(true);

    try {
      // 这里应该调用后端的模拟接口
      const response = await fetch(`/api/generation/simulate-progress/${selectedTask}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('模拟进度已开始！');
      } else {
        const error = await response.json();
        alert(`模拟失败：${error.error}`);
      }
    } catch (error) {
      alert(`网络错误：${error.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleComplete = (update: GenerationUpdate) => {
    console.log('生成完成:', update);
    alert(`任务 ${update.taskId} 已完成！`);
  };

  const handleError = (error: string) => {
    console.error('生成错误:', error);
    alert(`生成失败：${error}`);
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">WebSocket 实时进度测试</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧控制面板 */}
        <Card>
          <CardHeader>
            <CardTitle>控制面板</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 任务选择 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                选择任务
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">请选择任务</option>
                {mockTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.id} - {task.status} - {task.progress}%
                  </option>
                ))}
              </select>
            </div>

            {/* 认证令牌 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                认证令牌（JWT Token）
              </label>
              <Input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="输入 JWT token"
              />
              <p className="text-xs text-gray-500 mt-1">
                从浏览器开发者工具中复制 Authorization header 的值
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-2">
              <Button
                onClick={handleSimulateProgress}
                disabled={!selectedTask || !authToken || isSimulating}
              >
                {isSimulating ? '模拟中...' : '开始模拟进度'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  clearUpdates();
                  setSelectedTask('');
                  setAuthToken('');
                }}
              >
                清除
              </Button>
            </div>

            {/* 使用说明 */}
            <div className="text-sm text-gray-600">
              <h3 className="font-medium mb-2">使用说明：</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>先创建一个生成任务</li>
                <li>从浏览器开发者工具 Network 面板复制 Authorization header</li>
                <li>选择任务并粘贴令牌</li>
                <li>点击"开始模拟进度"查看实时更新</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* 右侧进度显示 */}
        <div className="space-y-6">
          {/* 任务1 - 实时进度 */}
          {selectedTask && (
            <GenerationProgress
              taskId={selectedTask}
              authToken={authToken}
              onComplete={handleComplete}
              onError={handleError}
            />
          )}

          {/* 任务状态示例 */}
          <Card>
            <CardHeader>
              <CardTitle>任务状态示例</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTasks.map((task) => (
                  <div key={task.id} className="p-4 border rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{task.id}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status} - {task.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* WebSocket 连接状态 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>连接状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-blue-600">1</div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Subscriptions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}