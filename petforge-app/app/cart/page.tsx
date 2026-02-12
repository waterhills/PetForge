"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCartIcon,
  DeleteOutlineIcon,
  RemoveIcon,
  AddIcon,
  SearchIcon,
  NotificationsIcon,
  ArrowForwardIcon,
  ShoppingBagIcon,
  LockIcon,
  VerifiedUserIcon,
  FavoriteBorderIcon,
  PetsIcon,
} from "@/components/ui/icons";
import { useCartStore } from "@/store/cartStore";
import api from "@/lib/api";
import Navigation from "@/components/layout/Navigation";

export default function CartPage() {
  const router = useRouter();
  const { items, loadCart, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState("wechat");
  const [isProcessing, setIsProcessing] = useState(false);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleCheckout = () => {
    if (items.length === 0) {
      alert("购物车为空");
      return;
    }
    // Navigate to checkout page
    router.push("/checkout");
  };

  const subtotal = getTotalPrice();
  const discount = 20;
  const total = Math.max(0, subtotal - discount);

  const recommendedItems = [
    {
      name: "定制宠物围巾",
      price: 49,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrixdKwBcThkW-2vitGzSIGPZO3nB720-w2gMvWUjIgCmdD-cuNUUIESNZiI3n3Vf2JZAS6rcKP5J2dhisZmqEA1sjctslBVJL1VQfmsIDd1aAu7HOIDqH_Cdkp--uVfO26czMyB4sZRRE_H2L9o8wviRMccXtzVTihV9rtnOKaa1SFZl8UY21A7t5xmRg7-grmjvIPgFp4dpU_jKXgPMgkPcpx-g9-Ve755bUHhHiBVR8TaJeWq-5lNtEH3Q1QCWrRSBNUqH3H8tg",
    },
    {
      name: "陶瓷宠物食盆",
      price: 89,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVxkkTtT4kVpih69HQZaveATEnJySHm9sKURgh2EgdlGGLxLAeg1urODbDWfBxLQI_6KoepKStIJXLSBARvJHXU5BMOqoTtyVRndY_bJOFkVNzDyp-bVnXLonZVPWkcxESbVbDiV_9gDOxbWe1wAtO6THhJqvdRftERz5IU4ZCaXXyK8MlhAZEAMqSzswW7JCiubRQ6ytHP2PwtV-aQRjBKbxKo_Jmj54CS0RcX6byAklwZ1jUzAwWUWencZKUV5fkx5J9jbuxSfc",
    },
  ];

  return (
    <div className="bg-tech-dark font-display text-gray-200 min-h-screen selection:bg-primary selection:text-white antialiased">
      {/* Navigation with User Avatar Dropdown */}
      <Navigation />

      {/* Progress Steps Bar */}
      <div className="w-full py-4 px-4 sm:px-6 lg:px-8 flex justify-center items-center bg-tech-dark/60 backdrop-blur-sm border-b border-tech-border">
        <div className="hidden md:flex items-center space-x-4 text-sm font-medium">
          <div className="flex items-center text-primary relative">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-primary bg-primary/10 rounded-full shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
              1
            </span>
            <span className="ml-3 font-semibold">购物车</span>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_4px_rgba(139,92,246,0.4)]"></div>
          </div>
          <div className="w-16 h-[1px] bg-gradient-to-r from-primary to-gray-700"></div>
          <div className="flex items-center text-gray-500">
            <span className="flex items-center justify-center w-8 h-8 border border-gray-700 bg-tech-card rounded-full shrink-0">
              2
            </span>
            <span className="ml-3">确认订单</span>
          </div>
          <div className="w-16 h-[1px] bg-gray-700"></div>
          <div className="flex items-center text-gray-500">
            <span className="flex items-center justify-center w-8 h-8 border border-gray-700 bg-tech-card rounded-full shrink-0">
              3
            </span>
            <span className="ml-3">完成</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Cart Items Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-tech-border">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <ShoppingCartIcon className="mr-2 text-primary" />
                购物车 <span className="text-sm font-normal text-gray-500 ml-3 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                  {getTotalItems()}件商品
                </span>
              </h1>
              <Link
                href="/"
                className="text-gray-400 hover:text-primary text-sm font-medium transition-colors flex items-center gap-1 group"
              >
                继续购物 <ArrowForwardIcon className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="bg-tech-card/50 rounded-xl p-12 text-center border border-tech-border">
                <ShoppingBagIcon className="mx-auto text-6xl text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">购物车是空的</p>
                <Link
                  href="/upload"
                  className="inline-block mt-6 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
                >
                  开始定制
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-tech-card/50 backdrop-blur-sm rounded-xl p-5 border transition-all border-tech-border hover:border-primary/50 hover:bg-tech-card hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                >
                  <div className="flex gap-6">
                    {/* Image */}
                    <div className="relative w-36 h-36 shrink-0 rounded-lg overflow-hidden bg-black/40 border border-white/5">
                      <img
                        src={item.generatedImage || item.originalImage || "/placeholder-pet.svg"}
                        alt={item.productName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-tech-dark/80 via-transparent to-transparent"></div>
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-primary/90 text-white px-2 py-0.5 rounded backdrop-blur-md border border-white/10 shadow-lg">
                        CUSTOM
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold tracking-wide text-white">
                            {item.productName}
                          </h3>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-white/5"
                          >
                            <DeleteOutlineIcon className="text-xl" />
                          </button>
                        </div>
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

                      <div className="flex justify-between items-end mt-4">
                        <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                          >
                            <RemoveIcon className="text-sm" />
                          </button>
                          <span className="w-10 text-center font-mono text-sm text-gray-200">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                          >
                            <AddIcon className="text-sm" />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="block text-xl font-bold font-mono tracking-tight text-white">
                            ¥{(item.price * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">单价: ¥{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Recommended Section */}
            <div className="pt-8 mt-8 border-t border-tech-border">
              <h4 className="text-lg font-bold mb-4 flex items-center text-white">
                <span className="mr-2 text-primary">✨</span>
                猜你喜欢
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendedItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-tech-card/50 p-3 rounded-lg border border-transparent hover:border-primary/50 hover:bg-tech-card transition-all cursor-pointer group"
                  >
                    <div className="aspect-square rounded-md bg-black/40 mb-3 overflow-hidden border border-white/5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-300 group-hover:text-white truncate">{item.name}</p>
                    <p className="text-xs text-primary font-bold mt-1 font-mono">¥{item.price}.00</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-tech-card/80 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-tech-border relative overflow-hidden group">
                {/* Background Effects */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/30 transition-colors duration-700"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-cyan/10 rounded-full blur-[60px] pointer-events-none"></div>

                <h2 className="text-lg font-bold mb-6 text-white tracking-wide border-l-4 border-primary pl-3 relative z-10">
                  订单汇总
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
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>会员折扣</span>
                      <span className="text-primary font-mono">-¥{discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Input */}
                <div className="mt-6 pt-6 border-t border-dashed border-white/10 relative z-10">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full bg-black/30 border border-white/10 rounded-lg text-sm px-4 py-2.5 text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        placeholder="输入优惠码"
                        type="text"
                      />
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium rounded-lg transition-colors">
                      应用
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                  <div className="flex justify-between items-end">
                    <span className="text-base font-medium text-gray-400">总计</span>
                    <span className="text-3xl font-bold text-white font-mono tracking-tight">¥{total.toFixed(2)}</span>
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-2 font-mono">包含增值税</p>
                </div>
              </div>

              {/* Payment Methods Card */}
              <div className="bg-tech-card/80 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-tech-border">
                <h2 className="text-lg font-bold mb-4 text-white tracking-wide border-l-4 border-primary pl-3">
                  支付方式
                </h2>
                <div className="space-y-3">
                  {/* WeChat Pay */}
                  <label className="relative flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all hover:bg-white/5 group border-primary/50 bg-primary/10 shadow-[inset_0_0_10px_rgba(139,92,246,0.1)]">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input
                          checked={paymentMethod === "wechat"}
                          onChange={() => setPaymentMethod("wechat")}
                          className="peer appearance-none w-5 h-5 border border-gray-500 rounded-full checked:border-primary checked:bg-primary transition-all"
                          name="payment"
                          type="radio"
                        />
                        <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2AAD67] flex items-center justify-center shadow-lg shadow-[#2AAD67]/20">
                          <span className="text-white text-xs font-bold">微信</span>
                        </div>
                        <span className="font-medium text-white">微信支付</span>
                      </div>
                    </div>
                    {paymentMethod === "wechat" && (
                      <span className="text-primary opacity-100 transition-opacity drop-shadow-[0_0_5px_rgba(139,92,246,0.8)]">✓</span>
                    )}
                  </label>

                  {/* Alipay */}
                  <label className="relative flex items-center justify-between p-4 border border-white/10 rounded-xl cursor-pointer transition-all hover:border-white/30 hover:bg-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input
                          checked={paymentMethod === "alipay"}
                          onChange={() => setPaymentMethod("alipay")}
                          className="peer appearance-none w-5 h-5 border border-gray-600 rounded-full checked:border-primary checked:bg-primary transition-all"
                          name="payment"
                          type="radio"
                        />
                        <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1678FF] flex items-center justify-center shadow-lg shadow-[#1678FF]/20">
                          <span className="text-white text-sm">支</span>
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white transition-colors">支付宝</span>
                      </div>
                    </div>
                  </label>

                  {/* Credit Card */}
                  <label className="relative flex items-center justify-between p-4 border border-white/10 rounded-xl cursor-pointer transition-all hover:border-white/30 hover:bg-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input
                          checked={paymentMethod === "card"}
                          onChange={() => setPaymentMethod("card")}
                          className="peer appearance-none w-5 h-5 border border-gray-600 rounded-full checked:border-primary checked:bg-primary transition-all"
                          name="payment"
                          type="radio"
                        />
                        <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
                          <span className="text-white text-sm">💳</span>
                        </div>
                        <span className="font-medium text-gray-300 group-hover:text-white transition-colors">信用卡</span>
                      </div>
                    </div>
                    <div className="flex -space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-4 bg-gray-600 rounded overflow-hidden border border-white/10"></div>
                      <div className="w-6 h-4 bg-gray-500 rounded overflow-hidden border border-white/10"></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || isProcessing}
                className={`w-full relative overflow-hidden font-bold py-4 px-6 rounded-xl transform transition flex items-center justify-center gap-2 text-lg group ${
                  items.length === 0 || isProcessing
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <>
                    <LockIcon className="text-xl group-hover:scale-110 transition-transform" />
                    <span className="tracking-wide">立即支付 ¥{total.toFixed(2)}</span>
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
