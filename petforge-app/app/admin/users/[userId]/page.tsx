"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import UserDetailHeader from "@/components/admin/UserDetailHeader";
import UserTabs from "@/components/admin/UserTabs";
import UserPetIPs from "@/components/admin/UserPetIPs";
import UserOrders from "@/components/admin/UserOrders";
import type { User } from "@/types/admin";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<(User & { totalSpent?: number }) | null>(null);
  const [activeTab, setActiveTab] = useState<'petips' | 'orders'>('petips');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getUserById(userId);
      if (result.success) {
        setUser(result.data);
      } else {
        setError(result.error || 'Failed to load user');
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">用户未找到</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">用户详情</h1>

      <UserDetailHeader
        user={user}
        onBack={() => router.push('/admin/users')}
      />

      <UserTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        petIPsCount={user._count.petIPs}
        ordersCount={user._count.orders}
      />

      {activeTab === 'petips' ? (
        <UserPetIPs userId={userId} />
      ) : (
        <UserOrders userId={userId} />
      )}
    </div>
  );
}
