"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  ReceiptIcon,
  ArrowForwardIcon,
  CreditCardIcon,
  LocalShippingIcon,
  CheckCircleIcon,
  CancelIcon,
  ScheduleIcon,
  VisibilityIcon,
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

function LocalShippingIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function ScheduleIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  );
}

function CancelIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
    </svg>
  );
}

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    productImage?: string;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: "Pending Payment", color: "text-yellow-400", bgColor: "bg-yellow-400/10", icon: ScheduleIconCustom },
  paid: { label: "Paid", color: "text-blue-400", bgColor: "bg-blue-400/10", icon: CreditCardIcon },
  shipped: { label: "Shipped", color: "text-cyan-400", bgColor: "bg-cyan-400/10", icon: LocalShippingIconCustom },
  completed: { label: "Completed", color: "text-green-400", bgColor: "bg-green-400/10", icon: CheckCircleIcon },
  cancelled: { label: "Cancelled", color: "text-red-400", bgColor: "bg-red-400/10", icon: CancelIconCustom },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent("/account/orders"));
    } else {
      loadOrders();
    }
  }, [isAuthenticated, router]);

  const loadOrders = async () => {
    try {
      const result = await api.getOrders(user?.id);
      if (result.success) {
        setOrders(result.data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all") return true;
    return order.status === activeFilter;
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "paid", label: "Paid" },
    { key: "shipped", label: "Shipped" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

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
                href="/account"
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Account Center
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ReceiptIconCustom className="text-primary" />
            My Orders
          </h1>
          <p className="text-gray-400 mt-2">View and manage your order history</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter.key
                  ? "bg-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-12 text-center">
            <ReceiptIconCustom className="mx-auto text-6xl text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-4">No orders found</p>
            <Link
              href="/upload"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <Link
                  key={order.id}
                  href={"/account/orders/" + order.id}
                  className="block bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6 hover:border-primary/50 hover:bg-tech-card transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="font-mono text-white font-bold">{order.orderNumber}</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                          <StatusIcon className="text-sm" />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{new Date(order.createdAt).toLocaleDateString("zh-CN")}</span>
                        <span>|</span>
                        <span>{order.items.length} items</span>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="w-12 h-12 rounded-lg bg-black/40 border-2 border-tech-card overflow-hidden"
                          >
                            <img
                              src={item.productImage || "/placeholder-pet.svg"}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 rounded-lg bg-black/40 border-2 border-tech-card flex items-center justify-center text-xs text-gray-400">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total & Action */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total</p>
                        <p className="text-xl font-bold text-white font-mono">{order.totalAmount.toFixed(2)}</p>
                      </div>
                      <ArrowForwardIcon className="text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
