"use client";

import { useEffect, useState, useMemo } from "react";
import { SearchIcon } from "@/components/ui/icons";
import api from "@/lib/api";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Toast from "@/components/admin/Toast";

interface PetIP {
  id: string;
  name: string;
  style: string;
  rarity: string;
  likes: number;
  isPublic: boolean;
  createdAt: string;
}

interface UserPetIPsProps {
  userId: string;
}

export default function UserPetIPs({ userId }: UserPetIPsProps) {
  const [petIPs, setPetIPs] = useState<PetIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [deletingPetIPId, setDeletingPetIPId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPetIPs();
  }, [userId]);

  const fetchPetIPs = async () => {
    setLoading(true);
    try {
      const result = await api.getUserPetIPs(userId);
      if (result.success) {
        setPetIPs(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch PetIPs:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleDeletePetIP = async () => {
    if (!deletingPetIPId) return;

    try {
      const result = await api.deletePetIP(deletingPetIPId);
      if (result.success) {
        setToast({ message: 'PetIP删除成功', type: 'success' });
        setDeletingPetIPId(null);
        fetchPetIPs();
      } else {
        setToast({ message: result.error || '删除失败', type: 'error' });
      }
    } catch (error) {
      console.error('Delete PetIP error:', error);
      setToast({ message: '删除失败', type: 'error' });
    }
  };

  const filteredPetIPs = useMemo(() => {
    if (!searchQuery) return petIPs;
    const query = searchQuery.toLowerCase();
    return petIPs.filter(
      (ip) =>
        ip.name.toLowerCase().includes(query) ||
        ip.style?.toLowerCase().includes(query)
    );
  }, [petIPs, searchQuery]);

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

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
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

      {/* PetIPs Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : filteredPetIPs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {searchQuery ? "没有找到匹配的宠物IP" : "该用户暂无宠物IP"}
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
                  <h3 className="font-bold text-white">{petIP.name}</h3>
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
