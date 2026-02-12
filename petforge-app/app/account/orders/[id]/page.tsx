"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  ArrowBackIcon,
  LocationOnIcon,
  CreditCardIcon,
  LocalShippingIcon,
  CheckCircleIcon,
  CancelIcon,
  ScheduleIcon,
  ShoppingBagIcon,
} from "@/components/ui/icons";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

// Custom icons
function ArrowBackIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

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

function ReceiptLongIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM15 20H6c-.55 0-1-.45-1-1v-1h10v2zm4-1c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14z" />
    </svg>
  );
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  creditsUsed: number;
  creditDiscount: number;
  paymentMethod: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    productType: string;
    quantity: number;
    price: number;
    size?: string;
    baseStyle?: string;
    productImage?: string;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any; description: string }> = {
  pending: { label: "Pending Payment", color: "text-yellow-400", bgColor: "bg-yellow-400/10", icon: ScheduleIconCustom, description: "Please complete payment as soon as possible" },
  paid: { label: "Paid", color: "text-blue-400", bgColor: "bg-blue-400/10", icon: CreditCardIcon, description: "Payment received, preparing your order" },
  shipped: { label: "Shipped", color: "text-cyan-400", bgColor: "bg-cyan-400/10", icon: LocalShippingIconCustom, description: "Your order is on the way" },
  completed: { label: "Completed", color: "text-green-400", bgColor: "bg-green-400/10", icon: CheckCircleIcon, description: "Order completed, thank you for your purchase" },
  cancelled: { label: "Cancelled", color: "text-red-400", bgColor: "bg-red-400/10", icon: CancelIconCustom, description: "Order has been cancelled" },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent("/account/orders"));
    } else {
      loadOrder();
    }
  }, [isAuthenticated, router, resolvedParams.id]);

  const loadOrder = async () => {
    try {
      const result = await api.getOrder(resolvedParams.id);
      if (result.success) {
        setOrder(result.data);
      }
    } catch (err) {
      console.error("Failed to load order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      router.push("/checkout/payment?orderId=" + order.id);
    } catch (err) {
      console.error("Failed to redirect:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const result = await api.updateOrderStatus(order.id, "completed");
      if (result.success) {
        setOrder({ ...order, status: "completed" });
      }
    } catch (err) {
      console.error("Failed to confirm receipt:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setActionLoading(true);
    try {
      const result = await api.updateOrderStatus(order.id, "cancelled");
      if (result.success) {
        setOrder({ ...order, status: "cancelled" });
      }
    } catch (err) {
      console.error("Failed to cancel order:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-tech-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-tech-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Order not found</p>
          <Link href="/account/orders" className="text-primary hover:text-primary-light mt-4 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

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
                href="/account/orders"
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Order List
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowBackIconCustom />
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ReceiptLongIcon className="text-primary text-xl" />
                <span className="font-mono text-xl font-bold text-white">{order.orderNumber}</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                  <StatusIcon className="text-base" />
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-gray-400">{status.description}</p>
              <p className="text-sm text-gray-500 mt-1">Created at: {new Date(order.createdAt).toLocaleString("zh-CN")}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {order.status === "pending" && (
                <>
                  <button
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                  <button
                    onClick={handlePayNow}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Pay Now
                  </button>
                </>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={handleConfirmReceipt}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Confirm Receipt
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border overflow-hidden">
              <div className="p-6 border-b border-tech-border">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBagIcon className="text-primary" />
                  Order Items
                </h2>
              </div>
              <div className="divide-y divide-tech-border">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-black/40 border border-white/5 overflow-hidden shrink-0">
                      <img
                        src={item.productImage || "/placeholder-pet.svg"}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.productName}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                          {item.productType}
                        </span>
                        {item.size && (
                          <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                            Size: {item.size}
                          </span>
                        )}
                        {item.baseStyle && (
                          <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                            Base: {item.baseStyle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-white">{item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Price Summary */}
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ReceiptIconCustom className="text-primary" />
                Price Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-gray-200 font-mono">{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-cyan-400">Free</span>
                </div>
                {order.creditDiscount > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Credits Discount</span>
                    <span className="text-primary font-mono">-{order.creditDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-xl font-bold text-white font-mono">{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <LocationOnIcon className="text-primary" />
                Shipping Address
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-white font-medium">{order.receiverName}</p>
                <p className="text-gray-400">{order.receiverPhone}</p>
                <p className="text-gray-400">{order.receiverAddress}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCardIcon className="text-primary" />
                Payment Method
              </h2>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  order.paymentMethod === "wechat" ? "bg-[#2AAD67]" :
                  order.paymentMethod === "alipay" ? "bg-[#1678FF]" :
                  "bg-gradient-to-br from-orange-500 to-orange-600"
                }`}>
                  <span className="text-white text-xs font-bold">
                    {order.paymentMethod === "wechat" ? "WeChat" :
                     order.paymentMethod === "alipay" ? "Ali" : "Card"}
                  </span>
                </div>
                <span className="text-gray-300">
                  {order.paymentMethod === "wechat" ? "WeChat Pay" :
                   order.paymentMethod === "alipay" ? "Alipay" : "Bank Card"}
                </span>
              </div>
            </div>
          </div>
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
