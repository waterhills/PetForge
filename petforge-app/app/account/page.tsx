"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  PersonIcon,
  LocationOnIcon,
  CreditCardIcon,
  ReceiptIcon,
  ArrowForwardIcon,
  ShoppingBagIcon,
  NotificationsIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

// Custom icons
function ReceiptIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H9V5h6v2z" />
    </svg>
  );
}

function SettingsIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

function StarsIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
    </svg>
  );
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    productName: string;
    productImage?: string;
  }>;
}

const quickActions = [
  {
    title: "My Orders",
    description: "View order history",
    icon: ReceiptIconCustom,
    href: "/account/orders",
    color: "from-purple-500 to-purple-600",
    shadowColor: "shadow-purple-500/20",
  },
  {
    title: "Addresses",
    description: "Manage addresses",
    icon: LocationOnIcon,
    href: "/account/addresses",
    color: "from-cyan-500 to-cyan-600",
    shadowColor: "shadow-cyan-500/20",
  },
  {
    title: "Points Center",
    description: "Check your points",
    icon: StarsIcon,
    href: "/account/points",
    color: "from-yellow-500 to-orange-500",
    shadowColor: "shadow-yellow-500/20",
  },
  {
    title: "Profile Settings",
    description: "Edit profile",
    icon: SettingsIconCustom,
    href: "/account/profile",
    color: "from-green-500 to-green-600",
    shadowColor: "shadow-green-500/20",
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, logout } = useAuthStore();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent("/account"));
    } else {
      loadRecentOrders();
    }
  }, [isAuthenticated, router]);

  const loadRecentOrders = async () => {
    try {
      const result = await api.getOrders(user?.id);
      if (result.success) {
        setRecentOrders(result.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      router.push("/");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-tech-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tech-dark font-display text-gray-200 selection:bg-primary selection:text-white antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 w-full border-b border-tech-border bg-tech-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10">
                <SmartToyIcon className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                PetAI <span className="text-primary text-glow">Creator</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Profile Card */}
        <div className="bg-tech-card/50 backdrop-blur-sm rounded-2xl border border-tech-border p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center ring-4 ring-primary/20">
                {user?.name ? (
                  <span className="text-3xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <PersonIcon className="text-4xl text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-tech-card flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-white mb-1">{user?.name || "User"}</h1>
              <p className="text-gray-400 mb-3">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <StarsIcon className="text-yellow-400" />
                  <span className="text-gray-300">{user?.credits || 0} Points</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="text-green-400" fill="currentColor" viewBox="0 0 20 20" width="1em" height="1em">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Verified Account</span>
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Link
              href="/account/profile"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2"
            >
              <SettingsIconCustom />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6 hover:border-primary/50 hover:bg-tech-card transition-all relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${action.color} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadowColor} mb-4`}>
                  <Icon className="text-white text-xl" />
                </div>
                <h3 className="font-bold text-white mb-1">{action.title}</h3>
                <p className="text-sm text-gray-400">{action.description}</p>
                <ArrowForwardIcon className="absolute bottom-4 right-4 text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>

        {/* Recent Orders */}
        <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border overflow-hidden">
          <div className="p-6 border-b border-tech-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ReceiptIconCustom className="text-primary" />
              Recent Orders
            </h2>
            <Link
              href="/account/orders"
              className="text-sm text-primary hover:text-primary-light transition-colors flex items-center gap-1"
            >
              View All <ArrowForwardIcon className="text-xs" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBagIcon className="mx-auto text-4xl text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">No orders yet</p>
              <Link
                href="/upload"
                className="inline-block px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-tech-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={"/account/orders/" + order.id}
                  className="p-6 hover:bg-white/5 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-10 rounded-lg bg-black/40 border-2 border-tech-card overflow-hidden"
                        >
                          <img
                            src={item.productImage || "/placeholder-pet.svg"}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-mono text-white font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString("zh-CN")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-mono text-white font-bold">{order.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} items</p>
                    </div>
                    <ArrowForwardIcon className="text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-tech-border mt-12 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            2023 PetAI Creator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
