"use client";

import { useEffect, useState } from "react";
import {
  UsersIcon,
  PetsIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from "@/components/ui/icons";
import api from "@/lib/api";

interface Stats {
  totalUsers: number;
  totalPetIPs: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPetIPs: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const result = await api.getStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "总用户数",
      value: stats.totalUsers,
      icon: <UsersIcon />,
      color: "bg-blue-500",
      trend: "+12%",
    },
    {
      title: "宠物IP总数",
      value: stats.totalPetIPs,
      icon: <PetsIcon />,
      color: "bg-purple-500",
      trend: "+8%",
    },
    {
      title: "总订单数",
      value: stats.totalOrders,
      icon: <ShoppingBagIcon />,
      color: "bg-green-500",
      trend: "+23%",
    },
    {
      title: "总收入",
      value: `¥${stats.totalRevenue.toLocaleString()}`,
      icon: <TrendingUpIcon />,
      color: "bg-orange-500",
      trend: "+15%",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">仪表盘</h1>
        <p className="text-gray-400 mt-1">欢迎回来，管理员</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {card.icon}
              </div>
              <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                {card.trend}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-white">{loading ? "..." : card.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Orders Alert */}
      {stats.pendingOrders > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xl">
              ⚠️
            </div>
            <div>
              <h3 className="text-yellow-400 font-bold">待处理订单</h3>
              <p className="text-gray-300">您有 {stats.pendingOrders} 个订单等待处理</p>
            </div>
            <a
              href="/admin/orders"
              className="ml-auto px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
            >
              立即处理
            </a>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <UsersIcon />
              <div>
                <h3 className="font-medium text-white">管理用户</h3>
                <p className="text-sm text-gray-400">查看和编辑用户信息</p>
              </div>
            </div>
          </a>
          <a
            href="/admin/petips"
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <PetsIcon />
              <div>
                <h3 className="font-medium text-white">管理宠物IP</h3>
                <p className="text-sm text-gray-400">审核和编辑宠物IP</p>
              </div>
            </div>
          </a>
          <a
            href="/admin/orders"
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <ShoppingBagIcon />
              <div>
                <h3 className="font-medium text-white">管理订单</h3>
                <p className="text-sm text-gray-400">处理和跟踪订单</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
