"use client";

import { useState } from "react";
import { User } from "@/types/admin";
import api from "@/lib/api";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Toast from "@/components/admin/Toast";

interface UserDetailHeaderProps {
  user: User & { totalSpent?: number };
  onBack: () => void;
  onEdit?: () => void;
}

export default function UserDetailHeader({ user, onBack, onEdit }: UserDetailHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editValue, setEditValue] = useState(user.credits.toString());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleEditCredits = async () => {
    try {
      const result = await api.updateUserCredits(user.id, parseInt(editValue));
      if (result.success) {
        setToast({ message: '积分修改成功', type: 'success' });
        setShowEditModal(false);
        // Refresh user data by calling onBack callback
        onBack();
      } else {
        setToast({ message: result.error || '修改失败', type: 'error' });
      }
    } catch (error) {
      console.error('Update credits error:', error);
      setToast({ message: '修改失败', type: 'error' });
    }
  };

  return (
    <div className="mb-8">
      {/* Breadcrumb / Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        ← 返回用户列表
      </button>

      {/* User Info Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-start justify-between">
          {/* Left: User Info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || "User"} className="w-full h-full rounded-full object-cover" />
              ) : (
                (user.name || user.email || "U").charAt(0).toUpperCase()
              )}
            </div>

            {/* Name & Email */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{user.name || "未命名用户"}</h2>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                注册于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              编辑用户
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">积分</p>
            <p className="text-xl font-bold text-white">{user.credits}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">宠物IP</p>
            <p className="text-xl font-bold text-white">{user._count.petIPs}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">订单</p>
            <p className="text-xl font-bold text-white">{user._count.orders}</p>
          </div>
          {user.totalSpent !== undefined && (
            <div>
              <p className="text-sm text-gray-400 mb-1">总消费</p>
              <p className="text-xl font-bold text-white">¥{user.totalSpent.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Credits Modal */}
      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="修改积分">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newCredits = parseInt(formData.get('credits') as string);
            handleEditCredits();
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">积分</label>
              <input
                type="number"
                name="credits"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors">
              保存修改
            </button>
          </form>
        </Modal>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
