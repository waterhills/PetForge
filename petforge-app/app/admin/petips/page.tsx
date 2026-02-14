"use client";

import { useEffect, useState, useMemo } from "react";
import { SearchIcon } from "@/components/ui/icons";
import api from "@/lib/api";
import UserFilter from "@/components/admin/UserFilter";
import FilterStatus from "@/components/admin/FilterStatus";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import PetIPForm from "@/components/admin/PetIPForm";
import Toast from "@/components/admin/Toast";
import type { User } from "@/types/admin";

interface PetIP {
  id: string;
  name: string;
  style: string;
  rarity: string;
  likes: number;
  isPublic: boolean;
  createdAt: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AdminPetIPs() {
  const [users, setUsers] = useState<User[]>([]);
  const [petIPs, setPetIPs] = useState<PetIP[]>([]);
  const [loading, setLoading] = useState({
    users: true,
    petIPs: true,
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPetIP, setEditingPetIP] = useState<PetIP | null>(null);
  const [deletingPetIPId, setDeletingPetIPId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(prev => ({ ...prev, users: true, petIPs: true }));
    try {
      const [usersResult, petIPsResult] = await Promise.all([
        api.getAllUsers(),
        api.getAllPetIPs(),
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data);
      }
      if (petIPsResult.success) {
        setPetIPs(petIPsResult.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(prev => ({ ...prev, users: false, petIPs: false }));
    }
  };

  const filteredPetIPs = useMemo(() => {
    let result = petIPs;

    // Filter by selected user
    if (selectedUserId) {
      result = result.filter((ip) => ip.userId === selectedUserId);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ip) =>
          ip.name.toLowerCase().includes(query) ||
          ip.style?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [petIPs, selectedUserId, searchQuery]);

  const handleClearFilter = () => {
    setSelectedUserId(null);
    setSearchQuery("");
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Legendary":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Epic":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Rare":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getRarityLabel = (rarity: string) => {
    const labels: Record<string, string> = {
      Legendary: "传说",
      Epic: "史诗",
      Rare: "稀有",
      Common: "普通",
    };
    return labels[rarity] || rarity;
  };

  const handleCreatePetIP = async (data: any) => {
    try {
      const result = await api.adminCreatePetIP(data);
      if (result.success) {
        setToast({ message: 'PetIP创建成功', type: 'success' });
        setShowCreateModal(false);
        fetchData();
      } else {
        setToast({ message: result.error || '创建失败', type: 'error' });
      }
    } catch (error) {
      console.error('Create PetIP error:', error);
      setToast({ message: '创建失败', type: 'error' });
    }
  };

  const handleEditPetIP = async (data: any) => {
    if (!editingPetIP) return;

    try {
      const result = await api.updatePetIP(editingPetIP.id, data);
      if (result.success) {
        setToast({ message: 'PetIP更新成功', type: 'success' });
        setEditingPetIP(null);
        fetchData();
      } else {
        setToast({ message: result.error || '更新失败', type: 'error' });
      }
    } catch (error) {
      console.error('Update PetIP error:', error);
      setToast({ message: '更新失败', type: 'error' });
    }
  };

  const handleDeletePetIP = async () => {
    if (!deletingPetIPId) return;

    try {
      const result = await api.deletePetIP(deletingPetIPId);
      if (result.success) {
        setToast({ message: 'PetIP删除成功', type: 'success' });
        setDeletingPetIPId(null);
        fetchData();
      } else {
        setToast({ message: result.error || '删除失败', type: 'error' });
      }
    } catch (error) {
      console.error('Delete PetIP error:', error);
      setToast({ message: '删除失败', type: 'error' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">宠物IP管理</h1>
          <p className="text-gray-400 mt-1">管理所有AI生成的宠物IP</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          + 添加PetIP
        </button>
      </div>

      {/* User Filter and Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* User Filter */}
        <div className="w-full md:w-64">
          <UserFilter
            users={users}
            selectedUserId={selectedUserId}
            onUserSelect={setSelectedUserId}
            loading={loading.users}
          />
        </div>

        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索宠物名称或风格..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Status */}
      <FilterStatus
        selectedUser={users.find((u) => u.id === selectedUserId) || null}
        filteredCount={filteredPetIPs.length}
        totalCount={petIPs.length}
        onClear={handleClearFilter}
      />

      {/* PetIPs Grid */}
      {loading.users || loading.petIPs ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : filteredPetIPs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {searchQuery ? "没有找到匹配的宠物IP" : "暂无宠物IP"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPetIPs.map((petIP) => (
            <div
              key={petIP.id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
            >
              {/* Image placeholder */}
              <div className="aspect-square bg-gray-700 flex items-center justify-center">
                <span className="text-6xl">🐾</span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white">{petIP.name}</h3>
                    <p className="text-sm text-gray-400">{petIP.user.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full border ${getRarityColor(petIP.rarity)}`}
                  >
                    {getRarityLabel(petIP.rarity)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span>风格: {petIP.style}</span>
                  <span>❤️ {petIP.likes}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
                    查看
                  </button>
                  <button
                    onClick={() => setEditingPetIP(petIP)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDeletingPetIPId(petIP.id)}
                    className="px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PetIP Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="添加PetIP">
          <PetIPForm onSubmit={handleCreatePetIP} />
        </Modal>
      )}

      {/* Edit PetIP Modal */}
      {editingPetIP && (
        <Modal isOpen={!!editingPetIP} onClose={() => setEditingPetIP(null)} title="编辑PetIP">
          <PetIPForm
            initialData={{
              name: editingPetIP.name,
              style: editingPetIP.style,
              rarity: editingPetIP.rarity,
            }}
            onSubmit={handleEditPetIP}
            submitLabel="更新"
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingPetIPId && (
        <ConfirmDialog
          isOpen={!!deletingPetIPId}
          onClose={() => setDeletingPetIPId(null)}
          onConfirm={handleDeletePetIP}
          title="确认删除"
          message="确定要删除这个PetIP吗？此操作不可撤销。"
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
