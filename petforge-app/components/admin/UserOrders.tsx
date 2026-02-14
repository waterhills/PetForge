"use client";

import { useEffect, useState, useMemo } from "react";
import { SearchIcon } from "@/components/ui/icons";
import api from "@/lib/api";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Toast from "@/components/admin/Toast";

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  receiverName: string;
  receiverPhone: string;
}

interface UserOrdersProps {
  userId: string;
}

export default function UserOrders({ userId }: UserOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await api.getUserOrders(userId);
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await api.getAllUsers();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleCreateOrder = async (data: any) => {
    try {
      const result = await api.createOrder(data);
      if (result.success) {
        setToast({ message: '订单创建成功', type: 'success' });
        setShowCreateModal(false);
        fetchOrders();
      } else {
        setToast({ message: result.error || '创建失败', type: 'error' });
      }
    } catch (error) {
      console.error('Create Order error:', error);
      setToast({ message: '创建失败', type: 'error' });
    }
  };

  const handleDeleteOrder = async () => {
    if (!deletingOrderId) return;

    try {
      const result = await api.deleteOrder(deletingOrderId);
      if (result.success) {
        setToast({ message: '订单删除成功', type: 'success' });
        setDeletingOrderId(null);
        fetchOrders();
      } else {
        setToast({ message: result.error || '删除失败', type: 'error' });
      }
    } catch (error) {
      console.error('Delete Order error:', error);
      setToast({ message: '删除失败', type: 'error' });
    }
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.receiverName.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "shipped":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "待处理",
      processing: "处理中",
      shipped: "已发货",
      completed: "已完成",
      cancelled: "已取消",
    };
    return labels[status] || status;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号或收货人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          + 添加订单
        </button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {searchQuery ? "没有找到匹配的订单" : "该用户暂无订单"}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">订单号</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">收货人</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">金额</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">状态</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">下单时间</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-white">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-gray-300">{order.receiverName}</td>
                  <td className="px-6 py-4 text-white">¥{order.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          // Update order status logic here if needed
                        }}
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="pending">待处理</option>
                        <option value="processing">处理中</option>
                        <option value="shipped">已发货</option>
                        <option value="completed">已完成</option>
                        <option value="cancelled">已取消</option>
                      </select>
                      <button
                        onClick={() => setDeletingOrderId(order.id)}
                        className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="添加订单">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              userId: userId,
              items: [],
              receiverName: formData.get('receiverName') as string,
              receiverPhone: formData.get('receiverPhone') as string,
              receiverAddress: formData.get('receiverAddress') as string,
              paymentMethod: formData.get('paymentMethod') as string,
              totalAmount: 0,
            };
            handleCreateOrder(data);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">收货人</label>
                <input type="text" name="receiverName" required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">联系电话</label>
                <input type="tel" name="receiverPhone" required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">收货地址</label>
              <input type="text" name="receiverAddress" required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">支付方式</label>
              <select name="paymentMethod" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white" required>
                <option value="wechat">微信支付</option>
                <option value="alipay">支付宝</option>
                <option value="credits">积分支付</option>
              </select>
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded">创建订单</button>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingOrderId && (
        <ConfirmDialog
          isOpen={!!deletingOrderId}
          onClose={() => setDeletingOrderId(null)}
          onConfirm={handleDeleteOrder}
          title="确认删除订单"
          message="确定要删除这个订单吗？此操作不可撤销。"
        />
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
