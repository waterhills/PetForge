"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  ArrowForwardIcon,
  ShoppingCartIcon,
  LogoutIcon,
  ExpandMoreIcon,
} from "@/components/ui/icons";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

// Additional icons needed for dropdown
function ExpandMoreIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </svg>
  );
}

function LogoutIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
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

function SettingsIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

export default function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, logout } = useAuthStore();
  const { items, loadCart } = useCartStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize auth and load cart on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated, loadCart]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push("/");
  };

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Get user initials for avatar placeholder
  const getUserInitials = () => {
    if (!user?.name) return "?";
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
              <SmartToyIcon className="relative z-10 text-3xl text-primary" />
            </div>
            <span className="font-display font-bold text-2xl text-white tracking-tight group-hover:text-glow transition-all">
              PetForge
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-10">
            <Link
              href="/upload"
              className="text-gray-300 hover:text-primary hover:text-glow font-medium transition-all text-sm uppercase tracking-wider"
            >
              创作
            </Link>
            <Link
              href="/showcase"
              className="text-gray-300 hover:text-primary hover:text-glow font-medium transition-all text-sm uppercase tracking-wider"
            >
              资产
            </Link>
            <Link
              href="/cart"
              className="text-gray-300 hover:text-primary hover:text-glow font-medium transition-all text-sm uppercase tracking-wider"
            >
              商店
            </Link>
            <Link
              href="/community"
              className="text-gray-300 hover:text-primary hover:text-glow font-medium transition-all text-sm uppercase tracking-wider"
            >
              社区
            </Link>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated && user ? (
              <>
                {/* User Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none group"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {getUserInitials()}
                        </span>
                      )}
                    </div>
                    <ExpandMoreIconCustom
                      className={`text-gray-400 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-surface-card/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fadeIn">
                      {/* User Info Header */}
                      <div className="px-4 py-4 border-b border-gray-700/50 bg-gradient-to-r from-primary/10 to-transparent">
                        <p className="font-semibold text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Cart with Badge */}
                        <Link
                          href="/cart"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ShoppingCartIcon className="text-lg text-primary" />
                            <span>购物车</span>
                          </div>
                          {cartItemCount > 0 && (
                            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                              {cartItemCount}
                            </span>
                          )}
                        </Link>

                        {/* My Orders */}
                        <Link
                          href="/account/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <ReceiptIconCustom className="text-lg text-primary" />
                          <span>我的订单</span>
                        </Link>

                        {/* Profile Settings */}
                        <Link
                          href="/account"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <SettingsIconCustom className="text-lg text-primary" />
                          <span>个人中心</span>
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-700/50" />

                      {/* Logout */}
                      <div className="py-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                          <LogoutIconCustom className="text-lg" />
                          <span>退出登录</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  登录
                </Link>
                <Link
                  href="/upload"
                  className="bg-primary/20 hover:bg-primary/40 text-primary-light border border-primary/50 px-6 py-2.5 rounded-full font-medium transition-all shadow-neon hover:shadow-lg flex items-center gap-2 group"
                >
                  <span className="group-hover:text-white transition-colors">
                    开始创作
                  </span>
                  <ArrowForwardIcon className="text-sm group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            {/* Simplified mobile view - just show login/avatar */}
            {isAuthenticated && user ? (
              <Link href="/account" className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center ring-2 ring-primary/30 overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </nav>
  );
}
