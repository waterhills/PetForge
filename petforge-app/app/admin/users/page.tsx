"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/ui/icons";
import api from "@/lib/api";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  credits: number;
  roleId: string | null;
  role: Role | null;
  createdAt: string;
  _count: {
    orders: number;
    petIPs: number;
  };
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await api.getAllUsers();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const result = await api.getAllRoles();
      if (result.success) {
        setRoles(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      const result = await api.updateUserRole(userId, roleId);
      if (result.success) {
        alert(`用户角色已更新为: ${result.data.role.name}`);
        fetchUsers();
      } else {
        alert(result.error || "Failed to update user role");
      }
    } catch (error: any) {
      console.error("Failed to update user role:", error);
      alert(error.message || "Failed to update user role");
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">用户管理</h1>
          <p className="text-gray-400 mt-1">管理系统中的所有用户</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户邮箱或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">用户</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">角色</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">积分</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">宠物IP</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">订单</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">注册时间</th>
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
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  {searchQuery ? "没有找到匹配的用户" : "暂无用户"}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name || "User"} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (user.name || user.email || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.name || "未命名用户"}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser?.id === user.id ? (
                      <select
                        value={user.roleId || ""}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        onBlur={() => setEditingUser(null)}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                        autoFocus
                      >
                        <option value="">无角色</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingUser(user)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          user.role?.name === "admin"
                            ? "bg-red-500/20 text-red-400"
                            : user.role?.name === "moderator"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {user.role?.name || "无角色"}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                      {user.credits} 积分
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user._count.petIPs}</td>
                  <td className="px-6 py-4 text-gray-300">{user._count.orders}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/users/${user.id}`);
                        }}
                      >
                        查看
                      </button>
                      <button
                        className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Delete action (placeholder)
                          console.log("Delete user:", user.id);
                        }}
                      >
                        删除
                      </button>
                    </div>
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
