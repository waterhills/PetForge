"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  LockIcon,
  EmailIcon,
  PersonIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  ArrowForwardIcon,
  ErrorIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();

  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "密码至少需要6个字符";
    }
    if (!/[A-Z]/.test(password)) {
      return "密码需要包含至少一个大写字母";
    }
    if (!/[a-z]/.test(password)) {
      return "密码需要包含至少一个小写字母";
    }
    if (!/[0-9]/.test(password)) {
      return "密码需要包含至少一个数字";
    }
    return null;
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

    const passwordError = validatePassword(password);
    if (passwordError) {
      setLocalError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("两次输入的密码不一致");
      return;
    }

    // Attempt registration
    await register(email, password, name || undefined);

    // The store will handle auto-login and navigation on success
  };

  const passwordStrength = () => {
    if (!password) return { strength: 0, text: "", color: "" };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, text: "弱", color: "bg-red-500" };
    if (strength <= 4) return { strength, text: "中", color: "bg-yellow-500" };
    return { strength, text: "强", color: "bg-green-500" };
  };

  const strength = passwordStrength();

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
                href="/login"
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                已有账号？登录
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
              <PersonIcon className="text-3xl text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">创建账号</h1>
            <p className="text-gray-400">开始您的AI宠物创作之旅</p>
          </div>

          {/* Register Card */}
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

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Name Field (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  姓名 <span className="text-gray-500">(可选)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PersonIcon className="text-gray-500 text-lg" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="您的称呼"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱地址 <span className="text-red-400">*</span>
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
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  密码 <span className="text-red-400">*</span>
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
                    placeholder="至少6个字符"
                    autoComplete="new-password"
                    required
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: `${(strength.strength / 6) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        strength.text === "弱" ? "text-red-400" :
                        strength.text === "中" ? "text-yellow-400" :
                        "text-green-400"
                      }`}>
                        {strength.text}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className={password.length >= 6 ? "text-green-400" : ""}>
                        ✓ 6个字符
                      </span>
                      <span className={/[A-Z]/.test(password) ? "text-green-400" : ""}>
                        ✓ 大写字母
                      </span>
                      <span className={/[a-z]/.test(password) ? "text-green-400" : ""}>
                        ✓ 小写字母
                      </span>
                      <span className={/[0-9]/.test(password) ? "text-green-400" : ""}>
                        ✓ 数字
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  确认密码 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockIcon className="text-gray-500 text-lg" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <VisibilityOffIcon className="text-lg" />
                    ) : (
                      <VisibilityIcon className="text-lg" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">两次输入的密码不一致</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-black/30 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <label htmlFor="terms" className="text-sm text-gray-400">
                  我已阅读并同意{" "}
                  <Link href="#" className="text-primary hover:text-primary-light transition-colors">
                    服务条款
                  </Link>
                  {" "}和{" "}
                  <Link href="#" className="text-primary hover:text-primary-light transition-colors">
                    隐私政策
                  </Link>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isLoading || !email || !password || password !== confirmPassword}
                className={`w-full relative overflow-hidden font-bold py-4 px-6 rounded-xl transform transition flex items-center justify-center gap-2 text-lg group ${
                  isLoading || !email || !password || password !== confirmPassword
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>注册中...</span>
                  </>
                ) : (
                  <>
                    <PersonIcon className="text-xl" />
                    <span className="tracking-wide">创建账号</span>
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

            {/* Login Link */}
            <div className="text-center relative z-10">
              <p className="text-gray-400 text-sm">
                已有账号？{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary-light font-medium transition-colors inline-flex items-center gap-1 group"
                >
                  立即登录
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
