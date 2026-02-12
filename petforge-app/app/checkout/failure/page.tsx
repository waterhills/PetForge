"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SmartToyIcon,
  ErrorIcon,
  RefreshIcon,
  ShoppingCartIcon,
  HomeIcon,
} from "@/components/ui/icons";

export default function PaymentFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error") || "Payment failed";
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/cart");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-tech-dark font-display text-gray-200 selection:bg-primary selection:text-white antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
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

            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg">
          {/* Failure Card */}
          <div className="bg-tech-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-tech-border p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Error Icon */}
            <div className="flex justify-center mb-6 relative z-10">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center">
                  <ErrorIcon className="text-red-400 text-5xl" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-white mb-2 relative z-10">
              Payment Failed
            </h1>
            <p className="text-gray-400 text-center mb-8 relative z-10">
              Unfortunately, your payment could not be processed
            </p>

            {/* Error Message */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 relative z-10">
              <p className="text-sm text-red-400 text-center">
                {errorMessage}
              </p>
            </div>

            {/* Suggestions */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-8 relative z-10">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Possible reasons:</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Insufficient balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Network connection issue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Payment gateway timeout</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Card information error</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3 relative z-10">
              <button
                onClick={() => router.push("/checkout/payment")}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
              >
                <RefreshIcon className="text-lg" />
                Retry Payment
              </button>
              <Link
                href="/cart"
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl font-medium transition-colors"
              >
                <ShoppingCartIcon className="text-lg" />
                Return to Cart
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
              Auto redirect to cart in {countdown} seconds...
            </p>
          </div>

          {/* Support */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <a href="#" className="text-primary hover:text-primary-light transition-colors">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
