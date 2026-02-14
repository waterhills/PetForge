"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Permission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setError(null);
      const result = await api.getAllRoles();
      if (result.success) {
        setRoles(result.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch roles:", error);
      setError(error.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const result = await api.getAllPermissions();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      return [];
    }
  };

  const handleCreateRole = async (name: string, description: string, selectedPermissions: string[]) => {
    try {
      const result = await api.createRole({
        name,
        description,
        permissionIds: selectedPermissions,
      });
      if (result.success) {
        setShowCreateModal(false);
        fetchRoles();
      } else {
        alert(result.error || "Failed to create role");
      }
    } catch (error: any) {
      console.error("Failed to create role:", error);
      alert(error.message || "Failed to create role");
    }
  };

  const handleViewRole = async (roleId: string) => {
    try {
      const result = await api.getRoleById(roleId);
      if (result.success) {
        setSelectedRole(result.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch role details:", error);
      alert(error.message || "Failed to fetch role details");
    }
  };

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">角色管理</h1>
            <p className="text-gray-400 mt-1">管理系统角色和权限</p>
          </div>
        </div>
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-red-400">
          <p className="font-medium mb-2">错误: {error}</p>
          <p className="text-sm text-red-300">请确保您已登录并具有管理员权限。如果问题持续存在，请尝试重新登录。</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">角色管理</h1>
          <p className="text-gray-400 mt-1">管理系统角色和权限</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          + 创建角色
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无角色</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => handleViewRole(role.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{role.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{role.description || "无描述"}</p>
                </div>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  {role.permissions.length} 权限
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">用户数量:</span>
                  <span className="text-white font-medium">{role.userCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">创建时间:</span>
                  <span className="text-white text-xs">
                    {new Date(role.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {role.permissions.slice(0, 3).map((perm) => (
                  <span
                    key={perm.id}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                  >
                    {perm.name}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                    +{role.permissions.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Detail Modal */}
      {selectedRole && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedRole(null)}
        >
          <div
            className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedRole.name}</h2>
                <p className="text-gray-400 mt-1">{selectedRole.description || "无描述"}</p>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">用户数量</h4>
                <p className="text-2xl font-bold text-white">{selectedRole.userCount}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">权限列表 ({selectedRole.permissions.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedRole.permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="bg-gray-700/50 rounded-lg p-3 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0">
                        {perm.resource.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{perm.name}</div>
                        <div className="text-xs text-gray-400">{perm.code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRole}
          fetchPermissions={fetchPermissions}
        />
      )}
    </div>
  );
}

interface Permission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
}

function CreateRoleModal({
  onClose,
  onCreate,
  fetchPermissions,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string, selectedPermissions: string[]) => Promise<void>;
  fetchPermissions: () => Promise<Permission[]>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      setLoadingPerms(true);
      const perms = await fetchPermissions();
      setPermissions(perms);
      setLoadingPerms(false);
    };
    loadPermissions();
  }, [fetchPermissions]);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name, description, selectedPermissionIds);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <form
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white">创建新角色</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">角色名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="例如: moderator"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">角色描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="角色描述..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              选择权限 ({selectedPermissionIds.length})
            </label>
            {loadingPerms ? (
              <div className="max-h-60 overflow-y-auto bg-gray-700/50 rounded-lg p-4 text-center text-gray-400">
                加载权限列表...
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto bg-gray-700/50 rounded-lg p-4 space-y-2">
                {permissions.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissionIds.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{perm.name}</div>
                      <div className="text-xs text-gray-400">{perm.code}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "创建中..." : "创建角色"}
          </button>
        </div>
      </form>
    </div>
  );
}
