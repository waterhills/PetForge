"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  ShoppingCartIcon,
  DeleteOutlineIcon,
  LockIcon,
  LocationOnIcon,
  CreditCardIcon,
  ArrowForwardIcon,
  VerifiedUserIcon,
  ErrorIcon,
} from "@/components/ui/icons";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, loadCart, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wechat");
  const [useCredits, setUseCredits] = useState(false);
  const [creditsToUse, setCreditsToUse] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string;
  }>({});

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
    }
  }, [isAuthenticated, router]);

  // Validate phone number
  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const subtotal = getTotalPrice();
  const creditDiscount = useCredits ? Math.min(creditsToUse, (user?.credits || 0), subtotal * 100) / 100 : 0;
  const total = Math.max(0, subtotal - creditDiscount);

  const handleRemoveItem = async (itemId: string) => {
    await removeItem(itemId);
  };

  const validateForm = () => {
    console.log('Validating form:', { receiverName, receiverPhone, receiverAddress });
    const errors: typeof fieldErrors = {};

    if (!receiverName.trim()) {
      errors.receiverName = "请输入收货人姓名";
    }

    if (!receiverPhone.trim()) {
      errors.receiverPhone = "请输入联系电话";
    } else if (!validatePhone(receiverPhone)) {
      errors.receiverPhone = "请输入有效的手机号码";
    }

    if (!receiverAddress.trim()) {
      errors.receiverAddress = "请输入收货地址";
    }

    setFieldErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('Validation result:', isValid, 'Errors:', errors);
    return isValid;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setError("");

    console.log('handleSubmit called, current values:', { receiverName, receiverPhone, receiverAddress });

    // Validate form first
    if (!validateForm()) {
      console.log('Validation failed, not submitting');
      return;
    }

    console.log('Validation passed, submitting order');

    if (items.length === 0) {
      setError("购物车为空，请先添加商品");
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        receiverName,
        receiverPhone,
        receiverAddress,
        paymentMethod,
        useCredits,
        creditsToUse: useCredits ? creditsToUse : 0,
      };

      const result = await api.createOrder(orderData);

      if (result.success) {
        // Clear cart and redirect to order success
        router.push("/community?order=success");
      } else {
        setError(result.error || "创建订单失败，请重试");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "提交订单失败，请稍后重试");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="bg-tech-dark font-display text-gray-200 min-h-screen selection:bg-primary selection:text-white antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-tech-border bg-tech-dark/80 backdrop-blur-md">
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
                <span className="ml-3">购物车</span>
              </div>
              <div className="w-16 h-[1px] bg-gray-700"></div>
              <div className="flex items-center text-primary relative">
                <span className="flex items-center justify-center w-8 h-8 border-2 border-primary bg-primary/10 rounded-full shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                  2
                </span>
                <span className="ml-3 font-semibold">确认订单</span>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_4px_rgba(139,92,246,0.4)]"></div>
              </div>
              <div className="w-16 h-[1px] bg-gray-700"></div>
              <div className="flex items-center text-gray-500">
                <span className="flex items-center justify-center w-8 h-8 border border-gray-700 bg-tech-card rounded-full shrink-0">
                  3
                </span>
                <span className="ml-3">完成</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/cart"
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                返回购物车
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column - Cart Items and Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Cart Items Section */}
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border overflow-hidden">
              <div className="p-6 border-b border-tech-border">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <ShoppingCartIcon className="mr-2 text-primary" />
                  商品清单 <span className="text-sm font-normal text-gray-500 ml-3">({getTotalItems()}件)</span>
                </h2>
              </div>

              {items.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingCartIcon className="mx-auto text-6xl text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg mb-4">购物车为空</p>
                  <Link
                    href="/upload"
                    className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
                  >
                    开始定制
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-tech-border">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex gap-6">
                        {/* Image */}
                        <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-black/40 border border-white/5">
                          <img
                            src={item.generatedImage || item.originalImage || "/placeholder-pet.svg"}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-primary/90 text-white px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">
                            CUSTOM
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-white">{item.productName}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.size && (
                                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                    尺寸: {item.size}
                                  </span>
                                )}
                                {item.baseStyle && (
                                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                    底座: {item.baseStyle}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-white/5 opacity-0 group-hover:opacity-100"
                            >
                              <DeleteOutlineIcon className="text-lg" />
                            </button>
                          </div>

                          <div className="flex justify-between items-end mt-4">
                            <span className="text-sm text-gray-400">数量: {item.quantity}</span>
                            <span className="text-lg font-bold font-mono text-white">
                              ¥{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Information Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <LocationOnIcon className="mr-2 text-primary" />
                  收货信息
                </h2>

                <div className="space-y-5">
                  {/* Receiver Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      收货人姓名 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className={`w-full px-4 py-3 bg-black/30 border rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                        fieldErrors.receiverName
                          ? "border-red-500/50 focus:ring-red-500 focus:border-red-500"
                          : "border-white/10"
                      }`}
                      placeholder="请输入收货人姓名"
                    />
                    {fieldErrors.receiverName && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <ErrorIcon className="text-xs" />
                        {fieldErrors.receiverName}
                      </p>
                    )}
                  </div>

                  {/* Receiver Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      联系电话 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className={`w-full px-4 py-3 bg-black/30 border rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                        fieldErrors.receiverPhone
                          ? "border-red-500/50 focus:ring-red-500 focus:border-red-500"
                          : "border-white/10"
                      }`}
                      placeholder="请输入手机号码"
                    />
                    {fieldErrors.receiverPhone && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <ErrorIcon className="text-xs" />
                        {fieldErrors.receiverPhone}
                      </p>
                    )}
                  </div>

                  {/* Receiver Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      收货地址 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 bg-black/30 border rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none ${
                        fieldErrors.receiverAddress
                          ? "border-red-500/50 focus:ring-red-500 focus:border-red-500"
                          : "border-white/10"
                      }`}
                      placeholder="请输入详细收货地址"
                    />
                    {fieldErrors.receiverAddress && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <ErrorIcon className="text-xs" />
                        {fieldErrors.receiverAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Credits Section */}
              {user && user.credits > 0 && (
                <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <CreditCardIcon className="mr-2 text-primary" />
                      积分抵扣
                    </h2>
                    <span className="text-sm text-gray-400">
                      可用积分: <span className="text-primary font-mono font-bold">{user.credits}</span>
                    </span>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={useCredits}
                        onChange={(e) => setUseCredits(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-600 bg-black/30 text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        使用积分抵扣 (100积分 = ¥1)
                      </span>
                    </label>

                    {useCredits && (
                      <div>
                        <input
                          type="number"
                          value={creditsToUse}
                          onChange={(e) => {
                            const value = Math.max(0, Math.min(parseInt(e.target.value) || 0, user.credits));
                            setCreditsToUse(value);
                          }}
                          max={user.credits}
                          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          placeholder={`输入要使用的积分数量 (最多${user.credits})`}
                        />
                        <p className="mt-2 text-sm text-gray-400">
                          可抵扣金额: <span className="text-primary font-mono">¥{(Math.min(creditsToUse, user.credits) / 100).toFixed(2)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <CreditCardIcon className="mr-2 text-primary" />
                  支付方式
                </h2>

                <div className="space-y-3">
                  {/* WeChat Pay */}
                  <label className="relative flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all hover:bg-white/5 group border-primary/50 bg-primary/10 shadow-[inset_0_0_10px_rgba(139,92,246,0.1)]">
                    <div className="flex items-center gap-3">
                      <input
                        checked={paymentMethod === "wechat"}
                        onChange={() => setPaymentMethod("wechat")}
                        className="w-5 h-5 border border-gray-500 text-primary focus:ring-primary focus:ring-offset-0"
                        name="payment"
                        type="radio"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2AAD67] flex items-center justify-center shadow-lg shadow-[#2AAD67]/20">
                          <span className="text-white text-xs font-bold">微信</span>
                        </div>
                        <span className="font-medium text-white">微信支付</span>
                      </div>
                    </div>
                    {paymentMethod === "wechat" && (
                      <span className="text-primary">✓</span>
                    )}
                  </label>

                  {/* Alipay */}
                  <label className="relative flex items-center justify-between p-4 border border-white/10 rounded-xl cursor-pointer transition-all hover:border-white/30 hover:bg-white/5 group">
                    <div className="flex items-center gap-3">
                      <input
                        checked={paymentMethod === "alipay"}
                        onChange={() => setPaymentMethod("alipay")}
                        className="w-5 h-5 border border-gray-600 text-primary focus:ring-primary focus:ring-offset-0"
                        name="payment"
                        type="radio"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1678FF] flex items-center justify-center shadow-lg shadow-[#1678FF]/20">
                          <span className="text-white text-sm">支</span>
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white transition-colors">支付宝</span>
                      </div>
                    </div>
                  </label>

                  {/* Bank Card */}
                  <label className="relative flex items-center justify-between p-4 border border-white/10 rounded-xl cursor-pointer transition-all hover:border-white/30 hover:bg-white/5 group">
                    <div className="flex items-center gap-3">
                      <input
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="w-5 h-5 border border-gray-600 text-primary focus:ring-primary focus:ring-offset-0"
                        name="payment"
                        type="radio"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
                          <CreditCardIcon className="text-white text-sm" />
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white transition-colors">银行卡</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Global Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <ErrorIcon className="text-red-400 text-xl mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-tech-card/80 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-tech-border relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-cyan/10 rounded-full blur-[60px] pointer-events-none" />

                <h2 className="text-lg font-bold mb-6 text-white tracking-wide border-l-4 border-primary pl-3 relative z-10">
                  订单摘要
                </h2>

                <div className="space-y-4 text-sm relative z-10">
                  <div className="flex justify-between text-gray-400">
                    <span>商品小计</span>
                    <span className="text-gray-200 font-mono">¥{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>运费</span>
                    <span className="text-accent-cyan font-medium">免运费</span>
                  </div>
                  {useCredits && creditDiscount > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>积分抵扣</span>
                      <span className="text-primary font-mono">-¥{creditDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                  <div className="flex justify-between items-end">
                    <span className="text-base font-medium text-gray-400">应付金额</span>
                    <span className="text-3xl font-bold text-white font-mono tracking-tight">¥{total.toFixed(2)}</span>
                  </div>
                  {useCredits && creditDiscount > 0 && (
                    <p className="text-right text-xs text-primary mt-2 font-mono">
                      使用积分: {creditsToUse} (¥{creditDiscount.toFixed(2)})
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Order Button */}
              <button
                onClick={handleSubmit}
                disabled={items.length === 0 || isProcessing}
                className={`w-full relative overflow-hidden font-bold py-4 px-6 rounded-xl transform transition flex items-center justify-center gap-2 text-lg group ${
                  items.length === 0 || isProcessing
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <>
                    <LockIcon className="text-xl" />
                    <span className="tracking-wide">提交订单 ¥{total.toFixed(2)}</span>
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <VerifiedUserIcon className="text-primary text-sm" />
                <span>SSL 加密安全支付保障</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-tech-border mt-12 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">© 2023 PetAI Creator. 保留所有权利.</div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a className="hover:text-primary transition-colors" href="#">隐私政策</a>
              <a className="hover:text-primary transition-colors" href="#">服务条款</a>
              <a className="hover:text-primary transition-colors" href="#">退换货政策</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
