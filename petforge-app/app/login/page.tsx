"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SmartToyIcon,
  LockIcon,
  EmailIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  ArrowForwardIcon,
  ErrorIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");
    setSuccessMessage("");

    // Validation
    if (!email) {
      setLocalError("请输入邮箱地址");
      return;
    }

    if (!validateEmail(email)) {
      setLocalError("请输入有效的邮箱地址");
      return;
    }

    if (!password) {
      setLocalError("请输入密码");
      return;
    }

    if (password.length < 6) {
      setLocalError("密码至少需要6个字符");
      return;
    }

    // Attempt login
    await login(email, password);

    // The store will handle navigation on success
  };

  return (
    <div className="min-h-screen flex flex-col bg-tech-dark font-display text-gray-200 selection:bg-primary selection:text-white antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-accent-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 w-full border-b border-tech-border bg-tech-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10">
                <SmartToyIcon className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                PetAI <span className="text-primary text-glow">Creator</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/register"
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                注册账号
              </Link>
              <Link
                href="/"
                className="text-gray-400 hover:text-primary text-sm font-medium transition-colors"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20 ring-1 ring-white/10 mb-4">
              <LockIcon className="text-3xl text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">欢迎回来</h1>
            <p className="text-gray-400">登录您的账户以继续</p>
          </div>

          {/* Login Card */}
          <div className="bg-tech-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-tech-border p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-cyan/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3 relative z-10">
                <CheckCircleIcon className="text-green-400 text-xl mt-0.5 flex-shrink-0" />
                <p className="text-green-400 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {(error || localError) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 relative z-10">
                <ErrorIcon className="text-red-400 text-xl mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error || localError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EmailIcon className="text-gray-500 text-lg" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockIcon className="text-gray-500 text-lg" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <VisibilityOffIcon className="text-lg" />
                    ) : (
                      <VisibilityIcon className="text-lg" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-black/30 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    记住我
                  </span>
                </label>
                <Link
                  href="#"
                  className="text-sm text-primary hover:text-primary-light transition-colors"
                >
                  忘记密码？
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full relative overflow-hidden font-bold py-4 px-6 rounded-xl transform transition flex items-center justify-center gap-2 text-lg group ${
                  isLoading
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <LockIcon className="text-xl" />
                    <span className="tracking-wide">登录</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-tech-card/80 text-gray-500 backdrop-blur-sm">
                  或
                </span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center relative z-10">
              <p className="text-gray-400 text-sm">
                还没有账号？{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary-light font-medium transition-colors inline-flex items-center gap-1 group"
                >
                  立即注册
                  <ArrowForwardIcon className="text-xs group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors inline-flex items-center gap-2"
            >
              <span>←</span>
              <span>返回首页</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-tech-border bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            © 2023 PetAI Creator. 保留所有权利.
          </div>
        </div>
      </footer>
    </div>
  );
}
