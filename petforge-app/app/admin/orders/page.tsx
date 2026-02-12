"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import api from "@/lib/api";

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  createdAt: string;
  user: {
    email: string;
  };
  _count: {
    items: number;
  };
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const result = await api.getAllOrders();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getPaymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      wechat: "微信支付",
      alipay: "支付宝",
      card: "信用卡",
    };
    return labels[method] || method;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">订单管理</h1>
          <p className="text-gray-400 mt-1">处理和跟踪所有订单</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号或收货人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">订单号</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">客户信息</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">金额</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">支付方式</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">状态</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">下单时间</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  {searchQuery ? "没有找到匹配的订单" : "暂无订单"}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-white">{order.orderNumber}</div>
                    <div className="text-xs text-gray-400">{order._count.items} 件商品</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">{order.receiverName}</div>
                    <div className="text-sm text-gray-400">{order.receiverPhone}</div>
                    <div className="text-xs text-gray-500">{order.receiverAddress}</div>
                  </td>
                  <td className="px-6 py-4 text-white font-bold">
                    ¥{order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {getPaymentLabel(order.paymentMethod)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="pending">待处理</option>
                      <option value="processing">处理中</option>
                      <option value="shipped">已发货</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
