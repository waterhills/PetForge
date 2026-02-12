"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  SmartToyIcon,
  CheckCircleIcon,
  ReceiptIcon,
  HomeIcon,
  ShoppingBagIcon,
} from "@/components/ui/icons";

// Custom ReceiptIcon
function ReceiptIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H9V5h6v2z" />
    </svg>
  );
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-tech-dark font-display text-gray-200 selection:bg-primary selection:text-white antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />
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

            {/* Progress Steps */}
            <div className="hidden md:flex items-center space-x-4 text-sm font-medium">
              <div className="flex items-center text-gray-500">
                <span className="flex items-center justify-center w-8 h-8 border border-gray-700 bg-tech-card rounded-full shrink-0">
                  1
                </span>
                <span className="ml-3">Shopping Cart</span>
              </div>
              <div className="w-16 h-[1px] bg-gray-700"></div>
              <div className="flex items-center text-gray-500">
                <span className="flex items-center justify-center w-8 h-8 border border-gray-700 bg-tech-card rounded-full shrink-0">
                  2
                </span>
                <span className="ml-3">Payment</span>
              </div>
              <div className="w-16 h-[1px] bg-primary"></div>
              <div className="flex items-center text-green-400 relative">
                <span className="flex items-center justify-center w-8 h-8 border-2 border-green-400 bg-green-400/10 rounded-full shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                  3
                </span>
                <span className="ml-3 font-semibold">Complete</span>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full shadow-[0_0_8px_4px_rgba(34,197,94,0.4)]"></div>
              </div>
            </div>

            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg">
          {/* Success Card */}
          <div className="bg-tech-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-tech-border p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Success Icon */}
            <div className="flex justify-center mb-6 relative z-10">
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                <div className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center">
                  <CheckCircleIcon className="text-green-400 text-5xl" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-white mb-2 relative z-10">
              Payment Successful
            </h1>
            <p className="text-gray-400 text-center mb-8 relative z-10">
              Your order has been placed successfully
            </p>

            {/* Order Info */}
            {orderId && (
              <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-8 relative z-10">
                <p className="text-sm text-gray-400 text-center">
                  Order Number
                </p>
                <p className="text-xl font-mono font-bold text-primary text-center mt-1">
                  {orderId}
                </p>
              </div>
            )}

            {/* Info List */}
            <div className="space-y-4 mb-8 relative z-10">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircleIcon className="text-green-400" />
                <span>Payment confirmed</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircleIcon className="text-green-400" />
                <span>Order notification sent</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircleIcon className="text-green-400" />
                <span>Estimated delivery: 3-5 business days</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 relative z-10">
              <Link
                href={orderId ? "/account/orders/" + orderId : "/account/orders"}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
              >
                <ReceiptIconCustom className="text-lg" />
                View Order Details
              </Link>
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl font-medium transition-colors"
              >
                <HomeIcon className="text-lg" />
                Return to Home
              </Link>
            </div>

            {/* Countdown */}
            <p className="text-center text-xs text-gray-500 mt-6 relative z-10">
              Redirecting to order details in {countdown} seconds...
            </p>
          </div>

          {/* Continue Shopping */}
          <div className="mt-6 text-center">
            <Link
              href="/upload"
              className="text-gray-400 hover:text-primary text-sm transition-colors inline-flex items-center gap-2"
            >
              <ShoppingBagIcon className="text-lg" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
