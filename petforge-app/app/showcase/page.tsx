"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SmartToyIcon,
  ViewInArIcon,
  CheckroomIcon,
  WallpaperIcon,
  ShoppingCartIcon,
  FavoriteBorderIcon,
  ThreeDRotationIcon,
  ZoomInIcon,
  LightModeIcon,
  RestartAltIcon,
  SparklesIcon,
  DownloadIcon,
} from "@/components/ui/icons";
import { useCartStore } from "@/store/cartStore";
import api from "@/lib/api";
import Navigation from "@/components/layout/Navigation";

function ShowcaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");
  const { addItem } = useCartStore();

  const [selectedProduct, setSelectedProduct] = useState("figurine");
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedBase, setSelectedBase] = useState("black");

  // PetIP列表状态
  const [userPetIPs, setUserPetIPs] = useState<any[]>([]);
  const [selectedPetIP, setSelectedPetIP] = useState<any>(null);
  const [isLoadingPetIPs, setIsLoadingPetIPs] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [petIP, setPetIP] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Track last loaded petId to prevent redundant fetches
  const lastLoadedPetId = useRef<string | null>(null);

  // Load user's PetIPs and current pet IP
  useEffect(() => {
    // Skip if we already loaded for this petId
    const currentPetId = petId || 'none';
    if (lastLoadedPetId.current === currentPetId) {
      return;
    }

    // Mark as loading immediately to prevent duplicate calls
    lastLoadedPetId.current = currentPetId;

    const loadUserPetIPs = async () => {
      try {
        setIsLoadingPetIPs(true);
        setAuthError(false); // Reset auth error before trying
        console.log('Loading user PetIPs...');

        const result = await api.getPetIPs({
          userId: 'current', // 获取当前用户的PetIP
        });

        console.log('PetIPs result:', result);

        if (result.success && result.data) {
          setUserPetIPs(result.data);
          console.log('User PetIPs loaded:', result.data.length);

          // 如果有petId参数，选择对应的PetIP，否则选择第一个
          if (result.data.length > 0) {
            const petIPToSelect = petId
              ? result.data.find(pet => pet.id === petId) || result.data[0]
              : result.data[0];

            setSelectedPetIP(petIPToSelect);
            setPetIP(petIPToSelect);
            console.log('Selected PetIP:', petIPToSelect.name);
          } else {
            // 用户没有PetIP，清空状态
            setPetIP(null);
            console.log('No PetIPs found for user');
          }
        } else {
          console.error('Failed to load PetIPs:', result);
          setPetIP(null);
        }
      } catch (error: any) {
        console.error('Failed to load user PetIPs:', error);
        // Check if it's an authentication error
        if (error.message === 'Access token required' || error.message === 'Authentication required to access your PetIPs' || error.message?.includes('401')) {
          setAuthError(true);
        }
        setPetIP(null);
      } finally {
        setIsLoadingPetIPs(false);
      }
    };

    // Load data on mount
    loadUserPetIPs();
  }, [petId]); // Only run when petId changes

  const products = [
    {
      id: "figurine",
      name: "3D 实体摆件",
      price: 299,
      icon: ViewInArIcon,
      description: "高精度树脂打印，手工上色",
    },
    {
      id: "tshirt",
      name: "定制 T 恤",
      price: 129,
      icon: CheckroomIcon,
      description: "100% 纯棉，高清印花",
    },
    {
      id: "wallpaper",
      name: "数字动态壁纸",
      price: 19.9,
      icon: WallpaperIcon,
      description: "4K 分辨率，支持 iOS/Android",
    },
  ];

  const sizes = [
    { id: "small", name: "小号", dimension: "8cm" },
    { id: "medium", name: "中号", dimension: "12cm" },
    { id: "large", name: "大号", dimension: "18cm" },
  ];

  const bases = [
    { id: "black", name: "经典黑", color: "bg-gray-900" },
    { id: "white", name: "纯白", color: "bg-gray-200 opacity-80" },
    { id: "gold", name: "奢华金", color: "bg-gradient-to-br from-yellow-700 to-yellow-900 opacity-80" },
    { id: "purple", name: "赛博紫", color: "bg-gradient-to-br from-primary to-purple-900 opacity-80" },
  ];

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  const handleAddToCart = async () => {
    if (!petIP) return;

    setIsAddingToCart(true);
    try {
      const sizeName = sizes.find((s) => s.id === selectedSize)?.name;
      const baseName = bases.find((b) => b.id === selectedBase)?.name;

      await addItem({
        petIpId: petIP.id,
        productType: selectedProduct,
        productName: `${selectedProductData?.name} - ${petIP.name}`,
        price: selectedProductData?.price || 0,
        size: selectedProduct === "figurine" ? sizeName : undefined,
        baseStyle: selectedProduct === "figurine" ? baseName : undefined,
        quantity: 1,
        originalImage: petIP.generatedImage,
        generatedImage: petIP.generatedImage,
      });

      alert("已添加到购物车！");
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("添加失败，请重试");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // 选择PetIP
  const handleSelectPetIP = (petIP: any) => {
    setSelectedPetIP(petIP);
    setPetIP(petIP); // 同时更新购物状态
  };

  // 跳转到生成页面
  const handleCreateNew = () => {
    router.push('/upload');
  };

  // Show loading while fetching PetIPs, but allow rendering when loading is complete (even if no PetIPs)
  if (isLoadingPetIPs || isLoading) {
    return (
      <div className="bg-background-dark text-gray-100 font-display h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // Show auth error if not logged in
  if (authError) {
    return (
      <div className="bg-background-dark text-gray-100 font-display h-screen overflow-hidden flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">需要登录</h2>
            <p className="text-gray-400 mb-8">请登录后查看您的IP形象资产</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/30"
              >
                去登录
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-bold transition-all"
              >
                返回首页
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show empty state when user has no PetIPs
  if (!petIP && userPetIPs.length === 0) {
    return (
      <div className="bg-background-dark text-gray-100 font-display h-screen overflow-hidden flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center max-w-md">
            <SmartToyIcon className="w-24 h-24 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-white mb-3">还没有IP形象</h2>
            <p className="text-gray-400 mb-8">创建您的第一个专属宠物IP形象，开启个性化之旅</p>
            <button
              onClick={handleCreateNew}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/30"
            >
              立即创建
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background-dark text-gray-100 font-display h-screen overflow-hidden flex flex-col">
      {/* Navigation with User Avatar Dropdown */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 flex pt-20 h-screen relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] gradient-glow-bg pointer-events-none z-0"></div>
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_30%_50%,rgba(140,43,238,0.08),transparent_50%)]"></div>

        {/* Left - PetIP List */}
        <section className="w-[400px] tech-sidebar flex flex-col h-full shadow-2xl z-20 overflow-hidden relative border-r border-white/10">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">我的IP形象</h2>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
              >
                <SparklesIcon className="text-lg" />
              </button>
            </div>
          </div>

          {/* PetIP List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoadingPetIPs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-dark/40 rounded-xl p-4 border border-white/10 animate-pulse">
                    <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto"></div>
                    <div className="h-2 bg-primary/30 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : userPetIPs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <SmartToyIcon className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg">还没有IP形象</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 px-6 py-3 rounded-lg bg-primary hover:bg-primary/80 text-white font-medium transition-colors"
                >
                  立即创建
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userPetIPs.map((ip) => (
                  <div
                    key={ip.id}
                    onClick={() => handleSelectPetIP(ip)}
                    className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer group ${
                      selectedPetIP?.id === ip.id
                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                        : 'border-white/10 bg-dark/40 hover:border-primary/50 hover:shadow-lg'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden border border-white/5 bg-white/5">
                      <img
                        src={ip.generatedImage}
                        alt={ip.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Selection Indicator */}
                      {selectedPetIP?.id === ip.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full border-2 border-white"></div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white mb-1 truncate">{ip.name}</h3>
                        <p className="text-xs text-gray-400 truncate">ID: #{ip.id?.slice(-8).toUpperCase()}</p>
                      </div>
                      {ip.rarity && (
                        <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                          ip.rarity === 'Legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                          ip.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
                          ip.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {ip.rarity}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Center - 3D Model Display */}
        <section className="flex-1 relative flex flex-col items-center justify-center p-8 z-10">
          <div className="relative w-full h-full max-h-[800px] flex items-center justify-center group">
            {/* Floor Projection */}
            <div className="absolute bottom-[20%] w-[600px] h-[200px] floor-projection pointer-events-none z-0"></div>

            {/* 3D Model Placeholder */}
            <div className="relative z-10 w-[550px] h-[550px] transition-transform duration-500 hover:scale-105">
              <img
                src={petIP.generatedImage}
                alt={`3D rendered ${petIP.name}`}
                className="w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(130,30,220,0.35)]"
              />
              {/* Interactive Hotspots */}
              <div className="absolute top-[30%] left-[60%] w-3 h-3 bg-primary rounded-full animate-ping opacity-75 cursor-pointer"></div>
              <div
                className="absolute top-[30%] left-[60%] w-3 h-3 bg-white rounded-full border border-primary cursor-pointer hover:scale-150 transition-transform shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                title="查看细节"
              ></div>
            </div>

            {/* Control Buttons */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 glass-panel px-8 py-4 rounded-2xl flex gap-8 shadow-2xl shadow-black/50 border border-white/10">
              <button className="text-gray-400 hover:text-tech-purple transition-colors flex flex-col items-center gap-1 group">
                <ThreeDRotationIcon className="group-hover:-translate-y-1 transition-transform text-white/80" />
                <span className="text-[10px] uppercase tracking-wider font-medium">旋转</span>
              </button>
              <button className="text-gray-400 hover:text-tech-purple transition-colors flex flex-col items-center gap-1 group">
                <ZoomInIcon className="group-hover:-translate-y-1 transition-transform text-white/80" />
                <span className="text-[10px] uppercase tracking-wider font-medium">缩放</span>
              </button>
              <button className="text-gray-400 hover:text-tech-purple transition-colors flex flex-col items-center gap-1 group">
                <LightModeIcon className="group-hover:-translate-y-1 transition-transform text-white/80" />
                <span className="text-[10px] uppercase tracking-wider font-medium">灯光</span>
              </button>
              <div className="w-px h-10 bg-white/10 mx-2 self-center"></div>
              <button className="text-primary-light hover:text-white transition-colors flex flex-col items-center gap-1 group">
                <RestartAltIcon className="group-hover:-translate-y-1 transition-transform" />
                <span className="text-[10px] uppercase tracking-wider font-medium">重置</span>
              </button>
            </div>

            {/* Model Info Badge */}
            <div className="absolute top-10 left-10 glass-panel px-4 py-2 rounded-lg text-sm text-gray-300 border-l-4 border-l-primary flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
              <span className="text-gray-200 font-medium">
                模型精度: <span className="text-tech-purple font-mono">4K Ultra</span>
              </span>
            </div>
          </div>
        </section>

        {/* Right - Product Customization Sidebar */}
        <aside className="w-[450px] tech-sidebar flex flex-col h-full shadow-2xl z-20 overflow-hidden relative">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl pointer-events-none"></div>

          {/* Product Info */}
          <div className="p-8 pb-6 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 border text-[10px] font-bold rounded uppercase tracking-widest backdrop-blur-sm ${
                petIP.rarity === 'Legendary' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                petIP.rarity === 'Epic' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                petIP.rarity === 'Rare' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                'bg-gray-500/20 border-gray-500/30 text-gray-400'
              }`}>
                {petIP.rarity}
              </span>
              <span className="text-xs text-gray-500 font-mono tracking-wide">ID: #{petIP.id?.slice(-8).toUpperCase()}</span>
            </div>
            <h1 className="text-3xl font-bold mb-3 text-white tracking-tight drop-shadow-md">
              {petIP.name}
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed font-light mb-6">
              基于您上传的照片 AI 生成的独一无二的 3D 形象。现在可以将它带入现实世界或数字空间。
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-bold hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2">
                <DownloadIcon />
                <span>下载模型</span>
              </button>
              <button className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-bold hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2">
                <FavoriteBorderIcon />
                <span>收藏</span>
              </button>
            </div>
          </div>

          {/* Scrollable Options */}
          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-8 relative z-10 custom-scrollbar">
            {/* Product Type Selection */}
            <div>
              <h3 className="text-xs font-bold text-tech-purple uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-8 h-px bg-tech-purple/30"></span>
                选择定制类型
                <span className="w-full h-px bg-tech-purple/10"></span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {products.map((product) => {
                  const IconComponent = product.icon;
                  const isSelected = selectedProduct === product.id;
                  return (
                    <label key={product.id} className="relative group cursor-pointer block">
                      <div
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 selection-active-glow"
                            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-lg flex items-center justify-center text-primary-light shadow-lg ${
                            isSelected ? "bg-gradient-to-br from-gray-800 to-black border border-white/10" : "bg-black/40 border border-white/5 text-gray-400"
                          }`}
                        >
                          <IconComponent className="text-2xl" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4
                              className={`font-bold text-lg ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"} transition-colors`}
                            >
                              {product.name}
                            </h4>
                            <span className={`font-bold font-mono ${isSelected ? "text-primary-light" : "text-gray-300"}`}>
                              ¥{product.price}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{product.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full border border-primary/50 bg-black/50 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(140,43,238,0.8)]"></div>
                          </div>
                        )}
                      </div>
                      <input
                        className="sr-only"
                        type="radio"
                        name="product_type"
                        checked={isSelected}
                        onChange={() => setSelectedProduct(product.id)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Size Selection (for figurine) */}
            {selectedProduct === "figurine" && (
              <div className="animate-fade-in">
                <h3 className="text-xs font-bold text-tech-purple uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="w-8 h-px bg-tech-purple/30"></span>
                  规格配置
                  <span className="w-full h-px bg-tech-purple/10"></span>
                </h3>
                <div className="mb-8">
                  <label className="block text-xs font-medium text-gray-400 mb-3">尺寸</label>
                  <div className="flex gap-3 bg-black/20 p-1 rounded-xl border border-white/5">
                    {sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedSize === size.id
                            ? "bg-primary/20 text-primary-light border border-primary/30 text-bold shadow-lg shadow-primary/10"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {size.name} ({size.dimension})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-3">底座样式</label>
                  <div className="grid grid-cols-4 gap-4">
                    {bases.map((base) => (
                      <button
                        key={base.id}
                        onClick={() => setSelectedBase(base.id)}
                        className={`aspect-square rounded-xl border p-1 transition-colors group relative ${
                          selectedBase === base.id
                            ? "border-primary bg-primary/10"
                            : "border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10"
                        }`}
                      >
                        <div className={`w-full h-full rounded-lg ${base.color}`}></div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 border border-white/20 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {base.name}
                        </span>
                        {selectedBase === base.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">商品详情</h3>
              <ul className="text-sm text-gray-400 space-y-2 list-none">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  独家 AI 建模技术，还原度 95% 以上
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  纯保树脂材料，无毒无味
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  发货时间：定制周期约 5-7 个工作日
                </li>
              </ul>
            </div>
          </div>

          {/* Footer - Price & Actions */}
          <div className="p-8 border-t border-white/10 bg-black/20 backdrop-blur-lg">
            <div className="flex justify-between items-end mb-5">
              <div>
                <p className="text-xs text-tech-purple mb-1">总计金额</p>
                <p className="text-3xl font-bold text-white font-mono tracking-tight">¥{selectedProductData?.price}.00</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 px-8 pb-8">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1 h-14 rounded-xl tech-btn-gradient text-white font-bold transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
              {isAddingToCart ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>添加中...</span>
                </>
              ) : (
                <>
                  <ShoppingCartIcon />
                  <span className="tracking-wide">加入购物车</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <Suspense fallback={
      <div className="bg-background-dark text-gray-100 font-display h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <ShowcaseContent />
    </Suspense>
  );
}
