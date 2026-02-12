"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import api from "@/lib/api";

interface PetIP {
  id: string;
  name: string;
  style: string;
  rarity: string;
  likes: number;
  isPublic: boolean;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AdminPetIPs() {
  const [petIPs, setPetIPs] = useState<PetIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPetIPs();
  }, []);

  const fetchPetIPs = async () => {
    try {
      const result = await api.getAllPetIPs();
      if (result.success) {
        setPetIPs(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch PetIPs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPetIPs = petIPs.filter((petIP) =>
    petIP.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    petIP.style.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">宠物IP管理</h1>
          <p className="text-gray-400 mt-1">管理所有AI生成的宠物IP</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
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

      {/* PetIPs Grid */}
      {loading ? (
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
                  <button className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
                    编辑
                  </button>
                  <button className="px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors">
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
