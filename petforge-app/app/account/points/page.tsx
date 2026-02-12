"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  StarsIcon,
  TrendingUpIcon,
  ShoppingBagIcon,
  CardGiftcardIcon,
} from "@/components/ui/icons";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

// Custom icons
function StarsIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
    </svg>
  );
}

function TrendingUpIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
    </svg>
  );
}

function ShoppingBagIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h12v12z" />
    </svg>
  );
}

function CardGiftcardIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
    </svg>
  );
}

function AccessTimeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  );
}

interface PointsRecord {
  id: string;
  type: string;
  amount: number;
  balance?: number;
  description?: string;
  createdAt: string;
}

const pointsRules = [
  { title: "Earn Points", value: "100 points", description: "per 1 CNY spent" },
  { title: "Redeem Points", value: "1 CNY", description: "per 100 points" },
  { title: "Max Usage", value: "50%", description: "of order value" },
  { title: "Expiration", value: "12 months", description: "from earning date" },
];

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  earn: { label: "Earned", color: "text-green-400", icon: ShoppingBagIconCustom },
  spend: { label: "Spent", color: "text-red-400", icon: CardGiftcardIconCustom },
  refund: { label: "Refund", color: "text-blue-400", icon: TrendingUpIconCustom },
  admin_add: { label: "Bonus", color: "text-yellow-400", icon: StarsIconCustom },
  admin_deduct: { label: "Deducted", color: "text-orange-400", icon: TrendingUpIconCustom },
};

export default function PointsPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent("/account/points"));
    } else {
      loadPointsData();
    }
  }, [isAuthenticated, router]);

  const loadPointsData = async () => {
    try {
      const [balanceResult, historyResult] = await Promise.all([
        api.getPointsBalance(),
        api.getPointsHistory({ page, limit: 10 }),
      ]);

      if (balanceResult.success) {
        setBalance(balanceResult.data.balance);
      }
      if (historyResult.success) {
        setHistory(historyResult.data);
      }
    } catch (err) {
      console.error("Failed to load points data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
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
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

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
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <StarsIconCustom className="text-yellow-400" />
            Points Center
          </h1>
          <p className="text-gray-400 mt-2">Manage your points and view transaction history</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-yellow-500/20 via-primary/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-yellow-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400 mb-2">Current Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white font-mono">{balance.toLocaleString()}</span>
                <span className="text-lg text-gray-400">points</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Equivalent to <span className="text-yellow-400 font-mono">{(balance / 100).toFixed(2)}</span> CNY
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/upload"
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
              >
                Earn More Points
              </Link>
              <Link
                href="/cart"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl font-medium transition-colors"
              >
                Use Points
              </Link>
            </div>
          </div>
        </div>

        {/* Rules & History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Points Rules */}
          <div className="lg:col-span-1">
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CardGiftcardIconCustom className="text-primary" />
                Points Rules
              </h2>
              <div className="space-y-4">
                {pointsRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <StarsIconCustom className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{rule.title}</p>
                      <p className="text-lg font-bold text-white">{rule.value}</p>
                      <p className="text-xs text-gray-500">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border overflow-hidden">
              <div className="p-6 border-b border-tech-border">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUpIconCustom className="text-primary" />
                  Transaction History
                </h2>
              </div>

              {history.length === 0 ? (
                <div className="p-12 text-center">
                  <AccessTimeIcon className="mx-auto text-4xl text-gray-600 mb-4" />
                  <p className="text-gray-400">No transaction history</p>
                </div>
              ) : (
                <div className="divide-y divide-tech-border">
                  {history.map((record) => {
                    const config = typeConfig[record.type] || typeConfig.earn;
                    const Icon = config.icon;
                    const isPositive = record.amount > 0;

                    return (
                      <div key={record.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg ${
                              isPositive ? "bg-green-500/10" : "bg-red-500/10"
                            } flex items-center justify-center`}>
                              <Icon className={config.color} />
                            </div>
                            <div>
                              <p className="font-medium text-white">{config.label}</p>
                              <p className="text-sm text-gray-500">{record.description}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {new Date(record.createdAt).toLocaleString("zh-CN")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-mono font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                              {isPositive ? "+" : ""}{record.amount}
                            </p>
                            {record.balance !== undefined && (
                              <p className="text-xs text-gray-500">Balance: {record.balance}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
